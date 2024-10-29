import { Router } from 'express';
import { Smtp } from '../models/smtp.model.js';
import mongoose from 'mongoose';
const router = Router();

// Add new SMTP
router.post('/', async (req, res) => {
  try {
    const isEmailExist = await Smtp.findOne({user: req.body.user})
    if(isEmailExist){
      throw new Error('This smtp user already exist')
    }
    const smtp = await Smtp.create(req.body);
    console.log(smtp);
    res.status(200).json({ success: true,message: 'SMTP added successfully', data: smtp });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
});

// Get all SMTP configurations
router.get('/', async (req, res) => {
  try {
    const smtpConfigs = await Smtp.find();
    res.status(200).json({
      success: true,
      message: "Fetch SMTP successfully",
      data: smtpConfigs
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SMTP configurations' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const smtpConfigs = await Smtp.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Delete SMTP successfully",
      data: smtpConfigs
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete SMTP configurations' });
  }
});
router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const smtpConfigs = await Smtp.findByIdAndUpdate(id, data, { new: true});
    res.status(200).json({
      success: true,
      message: "Update SMTP successfully",
      data: smtpConfigs
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SMTP configurations' });
  }
});
router.patch('/toggle/:id', async (req, res) => {
  const id = req.params.id
  console.log(id);
  // const session = await mongoose.startSession()
  // session.startTransaction()
  try {
    await Smtp.updateMany({isOpen: true}, {isOpen: false}, )
    const smtpConfigs = await Smtp.findByIdAndUpdate(id, req.body, );

    // session.commitTransaction()
    // session.endSession()
    res.status(200).json({
      success: true,
      message: "SMTP Update successfully",
      data: smtpConfigs
    })
  } catch (error) {
    // session.abortTransaction()
    // session.endSession()
    res.status(500).json({ success: false, message: 'Failed to update SMTP configurations', error });
  }
});

export const smtpRoutes = router;
