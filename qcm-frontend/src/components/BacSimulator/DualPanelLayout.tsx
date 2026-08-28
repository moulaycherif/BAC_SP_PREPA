import React from 'react';
import LeftPanelExam from './LeftPanel_Exam';
import RightPanelDashboard from './RightPanel_Dashboard';
import { BacExercise } from '../../services/bacService'; // 👈 Import du type

interface Props {
  exercise: BacExercise; // 👈 Déclaration de la prop attendue
}

const DualPanelLayout: React.FC<Props> = ({ exercise }) => {
  return (
    // Conteneur principal flexbox prenant toute la hauteur de l'écran
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      
      {/* Panneau de Gauche : Énoncé de l'épreuve */}
      <div className="w-1/2 h-full bg-white border-r border-gray-300 shadow-lg overflow-y-auto">
        {/* On passe l'exercice au panneau de gauche */}
        <LeftPanelExam exercise={exercise} />
      </div>

      {/* Panneau de Droite : Espace de travail & Tableau de bord */}
      <div className="w-1/2 h-full bg-gray-50 overflow-y-auto flex flex-col">
        {/* On passe l'exercice au panneau de droite */}
        <RightPanelDashboard exercise={exercise} />
      </div>
      
    </div>
  );
};

export default DualPanelLayout;