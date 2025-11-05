import React from 'react';
import ProjectRow from './ProjectRow';

export default function ProjectTable({ projects, onRunScript, onGitPull, onOpenFolder, projectNotes, onUpdateNote, onTagsChange, onMetadataUpdate, onViewDetails, onOpenSettings }) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto shadow-2xl rounded-lg">
      <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
        <thead className="bg-gray-700/70 border-b border-gray-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Проект
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <ProjectRow
              key={project.path}
              project={project}
              onRunScript={onRunScript}
              onGitPull={onGitPull}
              onOpenFolder={onOpenFolder}
              note={projectNotes[project.path]}
              onUpdateNote={onUpdateNote}
              onTagsChange={onTagsChange}
              onMetadataUpdate={onMetadataUpdate}
              onViewDetails={onViewDetails}
              onOpenSettings={onOpenSettings}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

