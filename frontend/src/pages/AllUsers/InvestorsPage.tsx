import React, { useState, useEffect } from "react";
import { ChevronRight, Star } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import GradientButton from "../../component/GradientButton";
import type { Investor } from "../../component/Interfaces";

export default function InvestorsPage() {
  // State for selected investor and list of investors
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null
  );
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  /**
   * Fetch investors data from Firebase Firestore
   * Filters users with role = "investor"
   */ 
  useEffect(() => {
  if (selectedInvestor) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}, [selectedInvestor]);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "users"),
          where("role", "==", "investor")
        );
        const querySnapshot = await getDocs(q);

        const investorsData: Investor[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();


          investorsData.push({
            id: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            role: data.role || "investor",
            investmentType: data.investmentType || "General Investment",
            About_me:
              data.aboutMe || "Professional investor with diverse portfolio.",
            photoURL:
              data.photoURL || `/userIcon.jpeg`,
            phoneNumber: data.phoneNumber || "",
            email: data.email || undefined,
          });
        });

        setInvestors(investorsData);
      } catch (error) {
        console.error("Error fetching investors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  // Handles clicking on an investor card
  const handleInvestorClick = (investor: Investor) =>
    setSelectedInvestor(investor);

  // Helper function to get full name or fallback label
  const getFullName = (investor: Investor) => {
    const name = `${investor.firstName} ${investor.lastName}`.trim();
    return name || "Investor";
  };

  /**
   * Single investor card component
   * Displays photo, name, and type
   */ 
  const InvestorCard = React.memo(
    ({
      investor,
      onClick,
    }: {
      investor: Investor;
      onClick: (investor: Investor) => void;
    }) => (
      <div
        onClick={() => onClick(investor)}
        className="relative rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      >
        <img
          src={investor.photoURL}
          alt={getFullName(investor)}
          className="w-full h-80 object-cover"
          loading="lazy"
        
        />
        <div className="absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t from-white via-white/90 to-transparent p-4">
          <h3 className="text-[23px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3D6A89] to-[#5AB3B6] mb-1">
            {getFullName(investor)}
          </h3>
          <p className="text-[#1E4263] text-m">{investor.investmentType}</p>
        </div>
        <ChevronRight className="absolute bottom-4 right-4 w-7 h-9 text-[#E0A817] group-hover:translate-x-1 transition-all" />
      </div>
    )
  );

  if (loading) {
    return (
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-[44px] -mt-1 font-petrona font-bold text-[#1E4263] mb-6">
            Investors
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading investors...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    //Design for Investors Page
    <section className="relative">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-[44px] -mt-1 font-petrona font-bold text-[#1E4263] mb-6">
          Investors
        </h1>

        {investors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              No investors available at the moment.
            </p>
          </div>
        ) : selectedInvestor ? (
          <div className="-mt-4">
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <img
                  src={selectedInvestor.photoURL}
                  alt={getFullName(selectedInvestor)}
                  className="w-65 h-80 rounded-lg object-cover"
                  onError={(
                    e: React.SyntheticEvent<HTMLImageElement, Event>
                  ) => {
                    const randomNum = Math.floor(Math.random() * 6) + 1;
                    e.currentTarget.src = `/investors/investor${randomNum}.png`;
                  }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {getFullName(selectedInvestor)}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-600">
                    {selectedInvestor.investmentType}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {selectedInvestor.About_me}
                </p>
              
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Other Investors
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {investors
                  .filter((inv) => inv.id !== selectedInvestor.id)
                  .map((inv) => (
                    <InvestorCard
                      key={inv.id}
                      investor={inv}
                      onClick={handleInvestorClick}
                    />
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {(showAll ? investors : investors.slice(0, 8)).map((inv) => (
              <InvestorCard
                key={inv.id}
                investor={inv}
                onClick={handleInvestorClick}
              />
            ))}
          </div>
        )}

        {!selectedInvestor &&
          investors.length > 0 &&
          !showAll &&
          investors.length > 8 && (
            <div className="flex justify-center mt-8">
              <GradientButton onClick={() => setShowAll(true)}>
                More
              </GradientButton>
            </div>
          )}
      </div>
    </section>
  );
}
