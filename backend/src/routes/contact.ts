import { Router } from "express";
import { z } from "zod";
import { deliveryFailed } from "../lib/errors.js";
import { MailDeliveryError, sendContactNotification } from "../mail/index.js";
import { contactLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

export const contactRouter = Router();

const contactBody = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email.").max(254),
  message: z.string().trim().min(1, "Write a message.").max(5000),
  website: z.string().max(200).optional(),
});

contactRouter.post("/contact", contactLimiter, validate({ body: contactBody }), async (req, res, next) => {
  const { name, email, message, website } = req.body as z.infer<typeof contactBody>;

  // Honeypot: pretend success, send nothing.
  if (website && website.trim().length > 0) {
    return res.status(202).json({ data: { accepted: true } });
  }

  try {
    await sendContactNotification({ name, email, message });
  } catch (error) {
    if (error instanceof MailDeliveryError) return next(deliveryFailed());
    return next(error);
  }

  res.status(202).json({ data: { accepted: true } });
});
