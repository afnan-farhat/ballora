import { useState } from 'react';
import { Info, Minus, Plus, Upload, X } from 'lucide-react';
import WhiteButton from '../../../component/WhiteButton';
import GradientButton from '../../../component/GradientButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import type { User } from "firebase/auth";
import { Upload as UploadClient } from "upload-js";
import type { FormDataState } from '../../../component/Interfaces';




export default function SubmitIdea() {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();
    const currentUser: User | null = auth.currentUser;
    const previousData = location.state?.businessModel || {};
    const [teamNumber, setTeamNumber] = useState<number>(
        (previousData as any).teamMember?.length || 1
    );
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const { businessModel, ideaData } = location.state;
    const [formData, setFormData] = useState<FormDataState>({
        teamMember:
            (previousData as any).teamMember || Array(teamNumber).fill(''),
        ideaImage: (previousData as any).ideaImage || null,
        additionalFile: (previousData as any).additionalFile || null,
    });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); // <-- modal state

    // Initialize Upload.io client (for secure file uploads)
    const upload = UploadClient({ apiKey: "public_W23MTRB4KCyCEpHHZigugRnUKhMS" });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


    //  Handles file uploads (for logo or additional file).
    const handleSubmit = async () => {
        if (!currentUser) {
            setSubmitError('You must be logged in to submit an idea.');
            return;
        }

        setSubmitError(null);
        setSubmitting(true);

        try {
            const allTeamEmails = [
                currentUser.email,
                ...formData.teamMember
            ].filter((e): e is string => !!e && e.trim() !== ''); // removes null or empty strings

            for (const email of allTeamEmails) {
                if (email === currentUser.email) continue;
                const snaps = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim())));
                if (snaps.empty) throw new Error(`Team member ${email} is not registered.`);
            }


            // Upload files to Upload.io
            const uploadFile = async (file: File | null): Promise<string | null> => {
                if (!file) return null;
                const { fileUrl } = await upload.uploadFile(file);
                return fileUrl;
            };

            const ideaImageUrl = await uploadFile(formData.ideaImage);
            const additionalFileUrl = await uploadFile(formData.additionalFile);


            const finalIdeaData = {
                ...ideaData,
                description: ideaData.summary,
                bmc: businessModel,
                userId: currentUser.uid,
                state: "Waiting",
                createdAt: new Date(),
                teamMember: allTeamEmails,
                ideaImageUrl,
                additionalFileUrl
            };

            await addDoc(collection(db, 'ideas'), finalIdeaData);

            navigate("/ideas");


        } catch (error: any) {

            console.error("Error:", error);
            setSubmitError(error.message || 'Error submitting idea.');
        } finally {
            setSubmitting(false);
            setIsConfirmOpen(false);
        }
    };

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



    // Increase or decrease the number of team members.
    const handleTeamNumberChange = (increment: number): void => {
        const newNumber = teamNumber + increment;
        if (newNumber >= 1) {
            setTeamNumber(newNumber);
            const newEmailMembers = [...formData.teamMember];
            if (increment > 0) newEmailMembers.push('');
            else if (newEmailMembers.length > 1) newEmailMembers.pop();
            setFormData(prev => ({ ...prev, teamMember: newEmailMembers }));
        }
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmailMembers = [...formData.teamMember];
        newEmailMembers[index] = value;
        setFormData(prev => ({ ...prev, teamMember: newEmailMembers }));
    };


    //Update an individual team member's email.
    const handleFileUpload = (field: keyof FormDataState): void => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;
            setFormData((prev) => ({ ...prev, [field]: file }));
        };
        input.click();
    };


    // Navigates back to the idea form while preserving current data.

    const handleBack = (): void => {
        navigate("/IdeaForm", { state: { businessModel: { ...previousData, ...formData } } });
    };

    return (
        <div className="flex items-center justify-center px-10 min-h-screen bg-gradient-to-b from-transparent via-[#EEF9F8] to-transparent">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-xl mx-4 px-21">
                <div className="space-y-6">
                    <h1 className='text-[25px] font-petrona font-bold text-[#1E4263] ml-14'>Complete Idea Information</h1>

                    {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md whitespace-pre-line">
                            {submitError}
                        </div>
                    )}

                    {/* Team Number */}
                    <div>
                        <label className="block text-m font-semibold text-black mb-2">Team Number</label>
                        <div className="flex items-center">
                            <input type="number" value={teamNumber} readOnly
                                className="flex-1 px-3 py-2 border-1 border-[#7C838A] rounded-l-md focus:outline-none bg-white" />
                            <div className="flex border-1 border-[#7C838A] rounded-r-md">
                                <button type="button" onClick={() => handleTeamNumberChange(-1)}
                                    className="px-2 py-3 hover:bg-gray-50" disabled={teamNumber <= 1}>
                                    <Minus className="w-4 h-4 text-gray-600" />
                                </button>
                                <button type="button" onClick={() => handleTeamNumberChange(1)}
                                    className="px-3 py-2 " disabled={teamNumber >= 6}>
                                    <Plus className="w-4 h-4 text-gray-600 " />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1"> Maximum 6 members </p>
                    </div>

                    {/* Emails */}
                    {teamNumber > 1 && formData.teamMember.slice(1).map((email, index) => (
                        <div key={index}>
                            <label className="block text-m font-semibold text-black mb-2">Email Member {index + 2}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(index + 1, e.target.value)}
                                className="w-full px-3 py-2 border-1 border-[#7C838A] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ))}

                    {/* Idea Image */}
                    <div>
                        <label className="block text-m font-semibold text-black mb-2">Idea Logo</label>
                        <div className="w-full mt-2">
                            {formData.ideaImage ? (
                                <div className="flex items-center justify-between border-1 border-[#33726D] rounded-md p-2">
                                    <span className="truncate">{formData.ideaImage.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, ideaImage: null }))}
                                        className="text-red-500 font-bold px-2"
                                    >
                                        x
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => handleFileUpload('ideaImage')}
                                    className="w-full mt-2 border-1 border-dashed border-[#33726D] rounded-md p-4 cursor-pointer flex items-center justify-center gap-2 hover:border-gray-400"
                                >
                                    <Upload className="w-6 h-6 text-[#33726D]" />
                                    <span className="text-m font-semibold text-[#33726D]">Upload</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional File */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-m font-semibold text-black">Additional File</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <Info className="w-4 h-4 mt-1.5" />
                                </button>
                                {showTooltip && (
                                    <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">Additional File</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Upload any extra files that support your idea. Just one file.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full mt-2">
                            {formData.additionalFile ? (
                                <div className="flex items-center justify-between border-1 border-[#33726D] rounded-md p-2">
                                    <span className="truncate">{formData.additionalFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, additionalFile: null }))}
                                        className="text-red-500 font-bold px-2"
                                    >
                                        x
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => handleFileUpload('additionalFile')}
                                    className="w-full mt-2 border-1 border-dashed border-[#33726D] rounded-md p-4 cursor-pointer flex items-center justify-center gap-2 hover:border-gray-400"
                                >
                                    <Upload className="w-6 h-6 text-[#33726D]" />
                                    <span className="text-m font-semibold text-[#33726D]">Upload</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center gap-4 pt-4">
                        <WhiteButton onClick={handleBack} className="!px-4 !py-2">Back</WhiteButton>
                        <GradientButton
                            onClick={() => setIsConfirmOpen(true)}
                            className="!px-4 !py-2"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </GradientButton>

                    </div>

                    {/* Confirm Modal */}
                    {isConfirmOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                                <button
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                                <h3 className="text-xl font-bold mb-4 text-center">Confirm Submission</h3>
                                <p className="text-gray-700 mb-6 text-center">
                                    Are you sure you want to submit this idea?
                                </p>
                                <div className="flex justify-center gap-4">
                                    <WhiteButton onClick={() => setIsConfirmOpen(false)}>Cancel</WhiteButton>
                                    <GradientButton onClick={handleSubmit}>Yes</GradientButton>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
