import React, { useState, useEffect } from "react";
import { ChevronRight, Star } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import GradientButton from "../../component/GradientButton";
import type { Investor } from "../../component/Interfaces";
import WhiteButton from "../../component/WhiteButton";

export default function InvestorsPage() {
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  useEffect(() => {
    if (selectedInvestor) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedInvestor]);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "users"), where("role", "==", "investor"));
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
            About_me: data.aboutMe || "Professional investor with diverse portfolio.",
            photoURL: data.photoURL || `/userIcon.jpeg`,
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

  const handleInvestorClick = (investor: Investor) => setSelectedInvestor(investor);

  const getFullName = (investor: Investor) => {
    const name = `${investor.firstName} ${investor.lastName}`.trim();
    return name || "Investor";
  };

  const InvestorCard = React.memo(({ investor, onClick }: { investor: Investor; onClick: (investor: Investor) => void; }) => (
    <div
      onClick={() => onClick(investor)}
      className="relative rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow group h-full"
    >
      {/* Adjusted height for mobile (h-64) and laptop (h-80) */}
      <img
        src={investor.photoURL}
        alt={getFullName(investor)}
        className="w-full h-64 sm:h-80 object-cover"
        loading="lazy"
      />
      <div className="absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t from-white via-white/90 to-transparent p-4">
        <h3 className="text-lg sm:text-[23px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3D6A89] to-[#5AB3B6] mb-1 line-clamp-1">
          {getFullName(investor)}
        </h3>
        <p className="text-[#1E4263] text-xs sm:text-sm">{investor.investmentType}</p>
      </div>
      <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 sm:w-7 sm:h-9 text-[#E0A817] group-hover:translate-x-1 transition-all" />
    </div>
  ));

  if (loading) {
    return (
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl sm:text-[44px] font-petrona font-bold text-[#1E4263] mb-6">Investors</h1>
          <div className="flex justify-center items-center h-64 text-gray-600">Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl sm:text-[44px] font-petrona font-bold text-[#1E4263] mb-6">
          Investors
        </h1>

        {investors.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No investors available.</div>
        ) : selectedInvestor ? (
          <div className="animate-fadeIn">
            {/* Responsive Details View: Column on mobile, Row on laptop */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="w-full md:w-64 flex-shrink-0">
                <img
                  src={selectedInvestor.photoURL}
                  alt={getFullName(selectedInvestor)}
                  className="w-full h-80 md:w-64 md:h-80 rounded-lg object-cover shadow-md"
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
                <p className="text-gray-700 leading-relaxed mb-6">
                  {selectedInvestor.About_me}
                </p>
                <WhiteButton onClick={() => setSelectedInvestor(null)} className="md:hidden w-full mb-8">
                    Back to List
                </WhiteButton>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Other Investors</h3>
              {/* Responsive Grid: 1 col mobile, 2 tablet, 4 laptop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {investors
                  .filter((inv) => inv.id !== selectedInvestor.id)
                  .map((inv) => (
                    <InvestorCard key={inv.id} investor={inv} onClick={handleInvestorClick} />
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Main Grid: Responsive column counts */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(showAll ? investors : investors.slice(0, 8)).map((inv) => (
              <InvestorCard key={inv.id} investor={inv} onClick={handleInvestorClick} />
            ))}
          </div>
        )}

        {!selectedInvestor && investors.length > 8 && !showAll && (
          <div className="flex justify-center mt-12">
            <GradientButton onClick={() => setShowAll(true)} className="px-10">
              More
            </GradientButton>
          </div>
        )}
      </div>
    </section>
  );
}