const Patient = require("../models/patientModel");

exports.getLabRequests = async (req, res) => {
  try {
    const pendingRequests = await Patient.aggregate([
      {
        $unwind: "$labReports"
      },
      {
        $match: {
          "labReports.result": { $exists: false }
        }
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          customId: { $first: "$customId" },
          contactNumber: { $first: "$contactNumber" },
          pendingTests: {
            $push: {
              testName: "$labReports.testName",
              dateRequested: "$labReports.date"
            }
          }
        }
      }
    ]);

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error fetching lab requests:", error);
    res.status(500).json({ 
      message: "Error fetching lab requests",
      error: error.message 
    });
  }
};

exports.updateLabResult = async (req, res) => {
  try {
    const { patientId, testName, result } = req.body;
    
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    if (!testName || !result) {
      return res.status(400).json({ message: "Test name and result are required" });
    }

    // Find the specific lab report to update
    const patient = await Patient.findOne({
      _id: patientId,
      "labReports.testName": testName,
      "labReports.result": { $exists: false }
    });

    if (!patient) {
      return res.status(404).json({ 
        message: "Pending lab test not found" 
      });
    }

    // Update the specific lab report
    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: patientId,
        "labReports.testName": testName
      },
      {
        $set: {
          "labReports.$.result": result,
          "labReports.$.date": new Date(),
          "labReports.$.technician": req.user.id
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: "Lab result updated successfully",
      patient: {
        customId: updatedPatient.customId,
        name: updatedPatient.name,
        updatedTest: updatedPatient.labReports.find(
          report => report.testName === testName
        )
      }
    });
  } catch (error) {
    console.error("Error updating lab result:", error);
    res.status(500).json({ 
      message: "Error updating lab result",
      error: error.message 
    });
  }
};