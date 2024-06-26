const express = require('express')
const router = express.Router()
const notification = require('../../models/notificatonschema')
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')
const User = require('../../models/userModel')
const Ticket = require('../../models/SupportTicket')

router.post('/createNotification', auth, isAdmin, async (req, res) => {
    try {
        const { title, message } = req.body;


        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide both title and message"
            });
        }
        
        const newNotification = new notification({
            title,
            message,
            date: new Date()
        });

        await newNotification.save();

        const updateResult = await User.updateMany({}, { $addToSet: { notification: newNotification } });

        res.status(200).json({
            success: true,
            message: "Notification sent successfully"
        });

    } catch (error) {
       
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});



router.get('/notifications', auth, async (req, res) => {
    try {
        // Fetch all notifications from the database
        const allNotifications = await notification.find().exec();

        if (!allNotifications || allNotifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No notifications available"
            });
        }

        res.status(200).json({
            success: true,
            notifications: allNotifications
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// User creates a ticket
router.post('/tickets',auth, async (req, res) => {
    console.log(req.body);
    const ticket = new Ticket({
      userId: req.user._id,
      message: req.body.message,
      mobile: req.body.mobile,
    });
    await ticket.save();
    res.status(201).send(ticket);
  });
  
 // Admin replies to a ticket
router.post('/tickets/replies', auth, async (req, res) => {
    const ticket = await Ticket.findById(req.body.ticketId);
    if (!ticket) {
      return res.status(404).send({ error: 'Ticket not found' });
    }
    ticket.replies.push({
      adminId: req.user._id,
      message: req.body.message
    });
    ticket.status = 'closed'; // Change status to 'closed'
    await ticket.save();
    res.status(201).send(ticket);
  });
  
  // Get all tickets
  router.get('/tickets',auth, async (req, res) => {
    const tickets = await Ticket.find();
    res.send(tickets);
  });
  

module.exports = router

