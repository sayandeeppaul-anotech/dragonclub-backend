const cron = require("node-cron");
const moment = require("moment");
const Salary = require("../models/salaryModel");
const User = require("../models/userModel");
const AllSalaryHistory = require("../models/AllSalaryHistory");
const { addTransactionDetails } = require("./TransactionHistoryControllers");

let job; // Variable to hold the cron job instance

const startSalaryCronJob = async (salaryDetails) => {
  try {
    const { uid, salaryFrequency, salaryAmount, frequencyLimit } = salaryDetails;

    // Find the most recent salary entry for this uid and salaryFrequency
    let existingJob = await Salary.findOne({ uid, salaryFrequency }).sort({ createdAt: -1 });

    if (existingJob) {
      // Update existing job details
      existingJob.salaryAmount = salaryAmount;
      existingJob.frequencyLimit = frequencyLimit;
      existingJob.nextPaymentDate = calculateNextPaymentDate(salaryFrequency);

      // Save updated salary details
      await existingJob.save();
    } else {
      // Create new salary entry
      const newSalaryDetails = new Salary({
        uid,
        salaryAmount,
        salaryFrequency,
        frequencyLimit,
        nextPaymentDate: calculateNextPaymentDate(salaryFrequency),
      });

      // Save salary details
      await newSalaryDetails.save();
      existingJob = newSalaryDetails; // Use existingJob for further processing
    }

    // Log initial frequency limit and next payment details
    console.log(`Salary details set successfully. Frequency limit: ${existingJob.frequencyLimit}`);
    console.log(`Next payment on: ${moment(existingJob.nextPaymentDate).format("MMMM Do, YYYY, h:mm:ss A")}`);
    console.log(`Frequency limit remaining: ${existingJob.frequencyLimit}`);

    // Start cron job to process salary payments
    const task = cron.schedule(getCronExpression(salaryFrequency), async () => {
      try {
        // Find salary entry by uid and salaryFrequency
        const updatedSalary = await Salary.findOne({ uid, salaryFrequency });

        // Check if salary details were found
        if (!updatedSalary) {
          throw new Error(`Salary details not found for uid: ${uid} and salaryFrequency: ${salaryFrequency}`);
        }

        // Check if frequency limit is greater than 0
        if (updatedSalary.frequencyLimit > 0) {
          // Decrement frequency limit
          updatedSalary.frequencyLimit--;

          // Find users by UID
          const usersToUpdate = await User.find({ uid });

          // Process payments for each user
          for (const user of usersToUpdate) {
            // Add salary amount to user's wallet
            user.walletAmount += updatedSalary.salaryAmount;
            await user.save();
            console.log(`Salary credited to user ${user._id}: ${updatedSalary.salaryAmount}`);

            // Log to AllSalaryHistory model
            const historyEntry = new AllSalaryHistory({
              uid: updatedSalary.uid,
              salaryAmount: updatedSalary.salaryAmount,
              salaryFrequency: updatedSalary.salaryFrequency,
              paymentDate: new Date(),
            });
            await historyEntry.save();

            // Add transaction details
            addTransactionDetails(user._id, updatedSalary.salaryAmount, "Salary", new Date());
          }

          // Update next payment date
          updatedSalary.nextPaymentDate = calculateNextPaymentDate(updatedSalary.salaryFrequency);

          // Save updated salary details
          await updatedSalary.save();

          // Log next payment date and remaining frequency limit
          console.log(`Next payment on: ${moment(updatedSalary.nextPaymentDate).format("MMMM Do, YYYY, h:mm:ss A")}`);
          console.log(`Frequency limit remaining: ${updatedSalary.frequencyLimit}`);

          // Stop the cron job if frequency limit reaches 0
          if (updatedSalary.frequencyLimit === 0) {
            console.log("Frequency limit reached. Stopping cron job.");
            task.stop();
          }
        } else {
          // If frequency limit is 0, stop cron job
          console.log("Frequency limit reached. Stopping cron job.");
          task.stop();
        }
      } catch (error) {
        console.error("Error processing salary payments:", error);
      }
    });

    task.start(); // Start the cron job
  } catch (error) {
    console.error("Error setting salary details:", error);
  }
};

const calculateNextPaymentDate = (salaryFrequency) => {
  switch (salaryFrequency) {
    case "Daily":
      return moment().add(1, "days").toDate();
    case "Weekly":
      return moment().add(1, "weeks").toDate();
    case "Monthly":
      return moment().add(1, "months").toDate();
    case "Yearly":
      return moment().add(1, "years").toDate();
    case "Hourly":
      return moment().add(1, "hours").toDate();
    case "Minutely":
      return moment().add(1, "minutes").toDate();
    default:
      throw new Error("Invalid salary frequency");
  }
};

const getCronExpression = (salaryFrequency) => {
  switch (salaryFrequency) {
    case "Daily":
      return "0 0 * * *"; // Every day at midnight
    case "Weekly":
      return "0 0 * * 1"; // Every week on Monday at midnight
    case "Monthly":
      return "0 0 1 * *"; // Every month on the 1st at midnight
    case "Yearly":
      return "0 0 1 1 *"; // Every year on Jan 1st at midnight
    case "Hourly":
      return "0 * * * *"; // Every hour
    case "Minutely":
      return "* * * * *"; // Every minute
    default:
      throw new Error("Invalid salary frequency");
  }
};

module.exports = startSalaryCronJob;
