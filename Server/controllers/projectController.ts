import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../config/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import path from "path";
import ai from "../config/ai.js";
import axios from "axios";

const loadImage = (path: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
};

export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string;
  const { userId } = req.auth();
  let isCreditDeducted = false;

  const {
    name = "New Project",
    aspectRatio,
    userPrompt,
    productName,
    productDescription,
    targetLenght = 5,
  } = req.body;
  const images: any = req.files;

  if (images.length < 2 || !productName) {
    return res.status(400).json({
      message: "Please provide at least 2 images and product name",
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || user.credits < 5) {
    return res.status(401).json({
      message: "User not found or insufficient credits",
    });
  } else {
    //deduct credits
    await prisma.user
      .update({
        where: { id: userId },
        data: { credits: { decrement: 5 } },
      })
      .then(() => {
        isCreditDeducted = true;
      });
  }
  try {
    let uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );
    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLenght),
        uploadedImages,
        isGenerating: true,
      },
    });
    tempProjectId = project.id;
    const model = "gemini-3.1-flash-image-preview";
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    //images to base64 structure for ai model
    const img1base64 = loadImage(images[0].path, images[0].mimetype);
    const img2base64 = loadImage(images[1].path, images[1].mimetype);

    const prompt = {
      text: `Combine the person and product into a realistic phto.Make the person naturally hold or use the product.
      Match lighting,shadow,scale and perspective.
      Make the person stand in professional studio lighting.
      Output ecommerce-quality photo realistic imagery. ${userPrompt}`,
    };

    //Generate the image using the ai model
    const response: any = await ai.models.generateContent({
      model,
      contents: [img1base64, img2base64, prompt],
      config: generationConfig,
    });

    //check if the response is valid
    if (!response?.candidates?.[0].content?.parts) {
      throw new Error("Unexpected respose");
    }
    const parts = response.candiadtes[0].content.parts;

    let finalBuffer: Buffer | null = null;
    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }
    if (!finalBuffer) {
      throw new Error("Failed to generate image");
    }
    const base64Image = `data:image/png;base64,${finalBuffer.toString("base64")}`;

    const uploadedResult = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedImage: uploadedResult.secure_url,
        isGenerating: false,
      },
    });

    res.status(200).json({
      projectId: project.id,
    });
  } catch (error: any) {
    if (tempProjectId!) {
      //update project status and error message
      await prisma.project.update({
        where: { id: tempProjectId },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }
    if (isCreditDeducted) {
      //add credit back
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
    }
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//Create video from image
export const createVideo = async (req: Request, res: Response) => {
  const { userId } = req.auth();
  const { projectId } = req.body;
  let isCreditDeducted = false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || user.credits < 10) {
    return res.status(401).json({
      message: "User not found or insufficient credits",
    });
  } else {
    //deduct credits
    await prisma.user
      .update({
        where: { id: userId },
        data: { credits: { decrement: 10 } },
      })
      .then(() => {
        isCreditDeducted = true;
      });
  }
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
      include: { user: true },
    });
    if (!project || project.isGenerating) {
      return res.status(404).json({ message: "Generation in progress" });
    }

    if (project.generatedVideo) {
      return res.status(404).json({ message: "Video already generated" });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isGenerating: true },
    });

    const prompt = `make the person showcase the product which is 
    ${project.productName} ${project.productDescription && `and Product Description: ${project.productDescription}`}`;

    const model = "veo-3.1-generate-preview";
    if (!project.generatedImage) {
      throw new Error("No generated image found");
    }
    const image = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });
    const imageBytes: any = Buffer.from(image.data);
    let operation: any = await ai.models.generateVideos({
      model,
      prompt,
      image: {
        imageBytes: imageBytes.toString("base64"),
        mimeType: "image/png",
      },
      config: {
        aspectRatio: project?.aspectRatio || "9:16",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    while (!operation.done) {
      console.log("Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    const filename = `${userId}-${Date.now()}.mp4`;
    const filepath = path.join("videos", filename);

    //creating the images directory if it doesn't exist
    fs.mkdirSync("videos", { recursive: true });

    if (!operation.response.generatedVideo) {
      throw new Error(operation.response.raiMediaFilteredReason[0]);
    }

    //Download the video

    await ai.files.download({
      file: operation.response.generatedVideo.videoFile,
      downloadPath: filepath,
    });

    //Upload the video to cloudinary
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      resource_type: "video",
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["VIDEO"],
      videoConfig: {
        aspectRatio: project.aspectRatio || "9:16",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };
    const response: any = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            data: Buffer.from(project.generatedImage).toString("base64"),
            mimeType: "image/png",
          },
        },
        {
          text: `Create a short video ad for the product in the image. The video should be ${project.targetLength} seconds long and should be in ${project.aspectRatio} aspect ratio. The video should be in ${project.userPrompt} style.`,
        },
      ],
      config: generationConfig,
    });
    if (!response?.candidates?.[0].content?.parts) {
      throw new Error("Unexpected response");
    }
    const parts = response.candidates[0].content.parts;
    let finalBuffer: Buffer | null = null;
    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }
    if (!finalBuffer) {
      throw new Error("Failed to generate video");
    }
    const base64Image = `data:image/png;base64,${finalBuffer.toString("base64")}`;
    const uploadedResult = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
    });
    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedVideo: uploadedResult.secure_url,
        isGenerating: false,
      },
    });
    res.status(200).json({
      projectId: project.id,
    });
  } catch (error: any) {
    if (isCreditDeducted) {
      //add credit back
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 10 } },
      });
    }
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//get all publishedProjects
export const getAllPublishedProjects = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//delete projects
export const deleteProject = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};
