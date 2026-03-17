import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Smart Upload',
        desc: 'Upload your product images or video and let our AI handle the rest.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Instant Generation',
        desc: 'Optimized models deliver output in second with great fidelity'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Video synthesis',
        desc: 'Synthesize your video in seconds with AI.'
    }
];

export const plansData = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$10',
        desc: 'Try the platform at no cost.',
        credits: '25',
        features: [
            '25 credits',
            'Standard quality',
            'No watermark',
            'Slower Generation speed',
            'Email support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        desc: 'Creators & small teams',
        credits: '80',
        features: [
            '80 credits',
            'HD quality',
            'No watermark',
            'Faster Generation speed',
            'Priority Email support'
        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Ultra',
        price: '$99',
        desc: 'Scale across team and agencies',
        credits: '300',
        features: [
            '300 credits',
            'FHD quality',
            'No watermark',
            'Faster Generation speed',
            'Priority Chat support',
            'Priority Email support'
        ]
    }
];

export const faqData = [
    {
        question: 'How does the AI generation work?',
        answer: 'Upload your product images or video and let our AI handle the rest.'
    },
    {
        question: 'Do I own the generated images?',
        answer: 'Yes, you own the generated images.'
    },
    {
        question: 'What are the pricing plans?',
        answer: 'We offer three pricing plans: Starter, Pro, and Ultra.'
    },
    {
        question: 'Do you offer any discounts for bulk purchases?',
        answer: 'Yes. We offer discounts for bulk purchases.'
    }
];

export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "#" },
            { name: "Features", url: "#" },
            { name: "Pricing", url: "#" },
            { name: "FAQ", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];