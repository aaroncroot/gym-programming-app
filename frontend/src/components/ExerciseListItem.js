import React, { useState } from 'react';
import ExerciseDetailsModal from './ExerciseDetailsModal';

function ExerciseListItem({ exercise, user }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <div className="exercise-list-item">
        <span className="exercise-name">
          {exercise.name} <span className="category-bracket">({exercise.category})</span>
        </span>
        <button className="details-btn" onClick={() => setShowDetailsModal(true)}>
          Show Details
        </button>
      </div>
      {showDetailsModal && (
        <ExerciseDetailsModal
          exercise={exercise}
          user={user}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
}

export default ExerciseListItem;
