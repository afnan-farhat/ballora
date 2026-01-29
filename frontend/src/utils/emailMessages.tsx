// emailMessages.ts (or emailMessages.tsx)

export const emailMessages: { [key: string]: { subject: string, message: string } } = {

  // --- Email Messages Configuration ---
  incubation: {
    subject: "Congratulations! Your idea has entered the Incubation State 🎉🚀",
    message: `Dear Entrepreneur,
We are pleased to inform you that, following the nomination process and thorough review, your idea has been officially incubated at the Entrepreneurship Center.

During the incubation phase, you will be assigned activities and deliverables designed to develop your idea into a complete project. This journey will take place through a one-year program, where you will submit required files and preparations to ensure your idea is fully ready to be presented to investors.

⚠️ Please note: if no activities are completed (minimum of three) during the incubation stage, your idea will be removed from the program and will not be accepted again.

We are proud to welcome you to our community and look forward to supporting you throughout this entrepreneurial journey until your idea reaches success.

Best regards,
Innovation and Entrepreneurship Center Team – King Abdulaziz University`
  },
  ready: {
    subject: "Congratulations! Your idea is now Ready To Invest 🎉🚀",
    message: `Dear Entrepreneur,
We are pleased to inform you that your idea has been updated to Ready To Invest.

This means your idea will now be showcased to potential investors actively seeking promising opportunities. Interested investors will be able to view your idea, request more details, and contact you directly through the platform.

Reaching this stage reflects the potential and maturity of your idea, and we are confident it will attract valuable interest. Our team will continue to support you to ensure your project is presented most professionally and compellingly 🚀.

We look forward to seeing your idea move forward and achieve real impact in the market🌟.

Best regards,
Innovation and Entrepreneurship Center Team – King Abdulaziz University`
  }
};