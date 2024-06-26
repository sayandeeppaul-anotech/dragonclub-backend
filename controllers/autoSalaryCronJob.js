const cron = require("node-cron");
const moment = require("moment");
const Salary = require("../models/salaryModel");
const User = require("../models/userModel");
const { addTransactionDetails } = require("./TransactionHistoryControllers");

const startSalaryCronJob = async (salaryDetails) => {
  try {
    // Create salary entry
    const salary = new Salary(salaryDetails);

    // Save salary details
    await salary.save();

    // Add salary amount to user's wallet
    const users = await User.find({ uid: salary.uid });
    for (const user of users) {
      user.walletAmount += salary.salaryAmount;
      addTransactionDetails(user._id, salary.salaryAmount, "Salary", new Date());
      await user.save();
    }

    // Calculate next payment date based on salary frequency
    let nextPaymentDate;
    switch (salary.salaryFrequency) {
      case "Daily":
        nextPaymentDate = moment().add(1, "days").toDate();
        break;
      case "Weekly":
        nextPaymentDate = moment().add(7, "days").toDate();
        break;
      case "Monthly":
        nextPaymentDate = moment().add(1, "months").toDate();
        break;
      default:
        break;
    }

    // Log next payment date and remaining frequency limit
    console.log(
      `Next payment on: ${moment(nextPaymentDate).format(
        "MMMM Do, YYYY, h:mm:ss A"
      )}`
    );
    console.log(`Frequency limit remaining: ${salary.frequencyLimit - 1}`);

    // Start cron job to process salary payments
    cron.schedule("0 0 * * 1", async () => {
      try {
        // Find salary entry by UID
        const updatedSalary = await Salary.findOne({ uid: salary.uid });

        // Check if frequency limit is greater than 0
        if (updatedSalary.frequencyLimit > 0) {
          // Find users by UID
          const usersToUpdate = await User.find({ uid: updatedSalary.uid });

          // Process payments for each user
          for (const user of usersToUpdate) {
            // Add salary amount to user's wallet
            user.walletAmount += updatedSalary.salaryAmount;
            addTransactionDetails(user._id, updatedSalary.salaryAmount, "Salary", new Date());
            await user.save();
          }

          // Update next payment date and decrement frequency limit
          updatedSalary.nextPaymentDate = nextPaymentDate;
          updatedSalary.frequencyLimit--;

          // Save updated salary details
          await updatedSalary.save();

          // Log next payment date and remaining frequency limit
          console.log(
            `Next payment on: ${moment(nextPaymentDate).format(
              "MMMM Do, YYYY"
            )}`
          );
          console.log(
            `Frequency limit remaining: ${updatedSalary.frequencyLimit}`
          );
        } else {
          // If frequency limit is 0, stop cron job
          console.log("Frequency limit reached. Stopping cron job.");
          cron.cancelTask(this);
        }
      } catch (error) {
        console.error("Error processing salary payments:", error);
      }
    });
  } catch (error) {
    console.error("Error setting salary details:", error);
  }
};

module.exports = startSalaryCronJob;