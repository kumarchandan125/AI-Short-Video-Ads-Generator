import { verifyWebhook } from '@clerk/express/webhooks'

import {Request,Response} from "express";

const clerkWebhooks= async (req:Request,res:Response)=>{
    try {
        const evt:any = await verifyWebhook(req)
    } catch (error) {
        
    }

}