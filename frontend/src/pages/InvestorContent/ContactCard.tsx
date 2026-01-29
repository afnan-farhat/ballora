// -------------------------------------------------------------
// ContactCard Component
// Displays a UI card prompting the user to start a chat session.
// Used to trigger communication with a team leader or support agent.
// -------------------------------------------------------------

import React from 'react';
import GradientButton from '../../component/GradientButton'; 

// Props definition: expects an async handler for starting the chat
interface ContactCardProps {
  handleStartChat: () => Promise<void>;
}

// Functional component to render the contact/chat initiation card
const ContactCard: React.FC<ContactCardProps> = ({ handleStartChat }) => {
  return (
    <div className="border-2 border-gray-200 rounded-2xl p-12">
      
      {/* Layout: Text on the left, button on the right */}
      <div className="flex justify-between items-center">
        
        {/* Left section: Title and description */}
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Open Chatting
          </h2>

          {/* Informational text */}
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl">
            Begin a conversation with the team leader to understand the
            concept,
            <br />
            evaluate its growth potential.
          </p>
        </div>

        {/* Right section: Start button */}
        <div className="ml-8">
          <GradientButton onClick={handleStartChat}>
            Start
          </GradientButton>
        </div>

      </div>
    </div>
  );
};

export default ContactCard;
