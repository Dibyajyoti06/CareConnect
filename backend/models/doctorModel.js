import mongoose from "mongoose";

const doctorSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    degree: {
      type: [String],
      required: true,
      validate: {
        validator: v => Array.isArray(v) && v.length > 0,
        message: "Degree must be a non-empty array"
      }
    },
    specialization: {
      type: String,
      required: true,
    },
    chamber: {
      type: String,
      required: true,
    },
    tag: {
      type: [String],
      required: true,
      validate: {
        validator: v => Array.isArray(v) && v.length > 0,
        message: "tag must be a non-empty array"
      }

    },
    available: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;