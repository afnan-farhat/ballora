import React from "react";
import { Gem, X } from "lucide-react";
import GradientButton from "../../component/GradientButton";
import type { SubscriptionModalsProps } from "../../component/Interfaces";


const SubscriptionModals: React.FC<SubscriptionModalsProps> = ({
  showPremiumModal,
  setShowPremiumModal,
  showSubscriptionModal,
  setShowSubscriptionModal,
  formData,
  handleInputChange,
  plans,
  selectedPlan,
  setSelectedPlan,
  handleStartFreeTrial,
}) => {
  return (
    <>
      {/* Premium Access Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative bg-white p-8 rounded-2xl w-[420px] text-center shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowPremiumModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex flex-col items-center">
              <Gem className="w-12 h-12 text-[#E0A817] mb-3" />

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-gray-900">
                Premium Access
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Unlock full features and gain exclusive access by joining our
                premium membership.
              </p>

              {/* Button */}
              <GradientButton
                size="mid"
                onClick={() => {
                  setShowPremiumModal(false);
                  setShowSubscriptionModal(true);
                }}
              >
                Upgrade
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-200  max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative p-6 pb-4 border-b border-gray-400">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                Ballora Subscription To See The Details Of The Ideas
              </h2>
            </div>

            {/* Modal Body*/}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Billing Information */}
                <div>
                  <h3 className="text-[#878787] font-medium mb-4 ">
                    Billing information
                  </h3>
                  {/* Billing input fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 ">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7E90] focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="Card Number"
                          maxLength={19}
                          className="w-full h-12 px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7E90] focus:border-transparent text-sm"
                        />
                        {/* Payment icons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                            alt="Visa"
                            className="h-5"
                          />
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                            alt="Mastercard"
                            className="h-5"
                          />
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                            alt="PayPal"
                            className="h-5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7E90] focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Security Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Code
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="CVV"
                        maxLength={3}
                        className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7E90] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  {/* Trial period info */}
                  <p className="text-xs text-[#619994] mt-4">
                    Your subscription begins today with a{" "}
                    <span className="font-bold">6 month free trial</span>. If
                    you decide to stop during the trial period, you can cancel
                    your subscription before{" "}
                    <span className="font-bold">September 26, 2026</span> and
                    your card won't be charged. We can't issue refunds once your
                    card is charged.{" "}
                  </p>
                </div>

                {/* Right Column - Membership Type */}
                <div>
                  <h3 className="text-[#878787] font-medium mb-4">
                    Membership Type
                  </h3>

                  {/* Plan options */}
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPlan === plan.id
                            ? "border-[#1F7E90] bg-[#1F7E90]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                              selectedPlan === plan.id
                                ? "border-[#1F7E90] bg-[#1F7E90]"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedPlan === plan.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {plan.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {plan.price}
                            </div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={selectedPlan === plan.id}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>

                  <p className="text-xs text-[#84949E] mt-4">
                    I agree to the{" "}
                    <u className="text-[#619994]">Terms of Use</u> and{" "}
                    <u className="text-[#619994]">Privacy Policy</u>.
                  </p>

                  {/* Upgrade Button */}
                  <GradientButton
                    className="! w-full mt-3 py-3 "
                    onClick={handleStartFreeTrial}
                  >
                    Start Free Trial 🚀
                  </GradientButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionModals;
