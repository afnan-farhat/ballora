import React from "react";
import type { TeamMember } from "../../component/Interfaces";

interface TeamTableProps {
  teamMembers: TeamMember[];
}

// Table Header
const TableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
  <thead>
    <tr className="bg-gray-100">
      {columns.map((col, index) => (
        <th
          key={index}
          className="px-6 py-4 text-left text-sm font-semibold text-gray-900 last:border-r-0"
        >
          {col}
        </th>
      ))}
    </tr>
  </thead>
);

const TeamTable: React.FC<TeamTableProps> = ({ teamMembers }) => {
  // Show a message if there are no team members
  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="text-center text-gray-400 italic py-12 text-sm">
        No team members found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        
        {/* Render table header */}
        <TableHeader
          columns={["#", "Name", "University", "Specialty", "Career", "Role"]}
        />

        <tbody>
          {teamMembers.map((member, index) => (
            <tr
              key={member.id || index}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
            >
              {/* Index number */}
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {index + 1}
              </td>

              {/* Member details */}
              <td className="px-6 py-4 text-sm text-gray-800">
                {member.name || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {member.university || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {member.specialty || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {member.career || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {member.role || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamTable;
