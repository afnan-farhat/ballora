// src/utils/ndaContent.ts

/**
 * This file contains the HTML string for the Non-Disclosure Agreement (NDA) popup.
 * It can be imported into any component where the NDA content is needed.
 */

export const ndaContent = `
  <div class="nda-popup">
    <div class="nda-content">
      <p>This Non-Disclosure Agreement ("Agreement") is entered into as of [Date], by and between:</p>
      <div style="margin-top: 12px;">
        <div><strong>Disclosing Party:</strong> [Sales Owner Name/Company]</div>
        <div><strong>Receiving Party:</strong> [Recipient Name/Company]</div>
      </div>
      <h3>1. Purpose</h3>
      <p>The Disclosing Party intends to share certain confidential information regarding a business idea (the "Idea") with the Receiving Party for the sole purpose of evaluation, discussion, or potential collaboration.</p>
      <h3>2. Definition of Confidential Information</h3>
      <p>For purposes of this Agreement, "Confidential Information" includes all written, oral, or electronic information related to the Idea, including but not limited to concepts, designs, strategies, data, plans, prototypes, and business models.</p>
      <h3>3. Obligations of Receiving Party</h3>
      <p style="margin-bottom: 8px;">The Receiving Party agrees to:</p>
      <ul>
        <li>Keep all Confidential Information strictly confidential.</li>
        <li>Not disclose the Confidential Information to any third party without prior written consent of the Disclosing Party.</li>
        <li>Use the Confidential Information solely for the Purpose described above.</li>
      </ul>
      <h3>4. Exclusions</h3>
      <p>This Agreement does not apply to information that: (a) is already known to the Receiving Party; (b) becomes publicly available through no breach of this Agreement; or (c) is independently developed by the Receiving Party without use of Confidential Information.</p>
    </div>
  </div>
`;
