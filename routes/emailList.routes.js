import { Router } from "express";
import { EmailList } from "../models/emailList.model.js";
const router = Router();

router.post("/", async (req, res) => {
  try {
    const emailList = new EmailList(req.body);
    await emailList.save();
    res
      .status(200)
      .json({ success: true, message: "Email list created", data: emailList });
  } catch (error) {
    res.status(500).json({ error: "Failed to create emails list" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await EmailList.find();
  res.status(200).json({
    success: true,
    message: "Fetch emails successfully",
    data: result,
  });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch emails list" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await EmailList.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Delete Email list successfully",
    data: result,
  });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete emails list" });
  }
});

export const emailListRoutes = router;
