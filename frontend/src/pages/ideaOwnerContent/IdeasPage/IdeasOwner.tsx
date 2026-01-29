import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import GradientButton from '../../../component/GradientButton';
import { useNavigate } from 'react-router-dom';
import ProfileNotification from '../../AllUsers/ProfileNotification';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';

function IdeasOwner() {
  const navigate = useNavigate();
    // Controls visibility of profile completion notification banner
  const [showProfileNotification, setShowProfileNotification] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIdeas = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
         // If the user is not logged in, show profile notification
        if (!user) {
          setShowProfileNotification(true);
          setLoading(false);
          return;
        }

        // Firestore query to check if this user has submitted any ideas
        const q = query(collection(db, 'ideas'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
         // If ideas exist, redirect user to the Ideas list

        if (!snap.empty) {
          navigate('/Ideas');
          return;
        }
        // Otherwise, stop loading and display the empty state

        setLoading(false);      
      } catch (err) {
        console.error('Error checking ideas:', err);
        setShowProfileNotification(true);
        setLoading(false);
      }
    };

    checkIdeas();
  }, [navigate]);

// Loading screen while verifying user and idea data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

    
   // Main layout: if no ideas are found, show
   //a friendly message encouraging the user
   //to create their first idea.
   
  return (
    <section className="relative ">
      {showProfileNotification && (
        <ProfileNotification message={"Please complete your profile to submit ideas"} />
      )}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-[50px] -mt-6 font-petrona font-bold text-[#1E4263] mb-8">Ideas</h1>

        {/* Empty State Card */}
        <div className="bg-[url('/idea.png')] bg-cover bg-no-repeat bg-right rounded-lg h-130 shadow-sm border border-[#B6B8B7] p-12 text-center relative flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-[30px] font-semibold text-gray-800 mb-4">
              Add your first idea to Start your journey
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-[20px]">
              Tap here to open the form and the AI<br />
              will generate your business model
            </p>

            <GradientButton
              className="!py-2 !px-6"
              onClick={() => navigate('/IdeaForm')}
            >
              <span className="flex items-center justify-center gap-2">
                Add Idea
                <Plus className="w-5 h-5" />
              </span>
            </GradientButton>
          </div>
        </div>
      </div>
    </section>
  );
}
export default IdeasOwner;