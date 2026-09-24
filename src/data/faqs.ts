export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const faqCategories = ['Navigation', 'Buildings', 'Search', 'Offline Usage', 'Accessibility', 'General'] as const;
export type FAQCategory = (typeof faqCategories)[number];

export const faqs: FAQItem[] = [
  { id: 'navigate', category: 'Navigation', question: 'How do I navigate to a building?', answer: 'Select a building, set it as your start or destination, then open Navigate. The map highlights the route and shows turn-by-turn walking directions.' },
  { id: 'shortest-route', category: 'Navigation', question: 'How is the shortest route calculated?', answer: 'The application uses the A* pathfinding algorithm to find an efficient route through the campus path network.' },
  { id: 'change-destination', category: 'Navigation', question: 'Can I change my destination after starting navigation?', answer: 'Yes. Choose another building as the destination and the route is recalculated for the new selection.' },
  { id: 'start-building', category: 'Navigation', question: 'Can I start navigation from any building?', answer: 'You can start from any building that is connected to the mapped campus path network.' },
  { id: 'route-colours', category: 'Navigation', question: 'What do the route colours mean?', answer: 'Route colours distinguish the active path from the rest of the campus map. Start and destination markers identify each end of the journey.' },
  { id: 'no-route', category: 'Navigation', question: 'What happens if no route is available?', answer: 'The navigation panel displays a no-route message. Try a different building or confirm that both locations are part of the mapped network.' },
  { id: 'building-info', category: 'Buildings', question: 'How do I view information about a building?', answer: 'Select a building on the interactive map or from the search results to open its information panel.' },
  { id: 'building-photo', category: 'Buildings', question: 'Why does a building display a photo?', answer: 'Photos help you recognise selected campus buildings more easily when planning or following a route.' },
  { id: 'building-details', category: 'Buildings', question: 'What information is available for each building?', answer: 'Where available, the panel shows the building name, faculty, departments, opening hours, accessibility details, floors, occupancy and an image.' },
  { id: 'entrances', category: 'Buildings', question: 'How do I identify building entrances?', answer: 'Routes begin and end at the mapped entrance points associated with each building, helping guide you to the campus path network.' },
  { id: 'search-building', category: 'Search', question: 'How do I search for a building?', answer: 'Use the search box at the top of the sidebar and enter a building name, faculty or department.' },
  { id: 'no-results', category: 'Search', question: 'What if my search returns no results?', answer: 'Try a shorter or different spelling, or search using a related faculty or department name.' },
  { id: 'search-fields', category: 'Search', question: 'Can I search by faculty or department?', answer: 'Yes. Search matches building names, short names, faculties and listed departments.' },
  { id: 'internet', category: 'Offline Usage', question: 'Does the application require an internet connection?', answer: 'No. The campus map, building data and route calculations are designed to work offline once the application is available on your device.' },
  { id: 'wifi', category: 'Offline Usage', question: 'Will the map still work without Wi-Fi?', answer: 'Yes. The interactive SVG map and offline route computation do not depend on Wi-Fi during use.' },
  { id: 'tracking', category: 'Offline Usage', question: 'Is my location tracked?', answer: 'No. This version plans routes between buildings you choose and does not track your live location.' },
  { id: 'mobile-data', category: 'Offline Usage', question: 'Does the application use mobile data?', answer: 'Route planning and map interaction are offline features, so they do not need mobile data during use.' },
  { id: 'accessible', category: 'Accessibility', question: 'Is the application accessible?', answer: 'The interface includes accessible route preferences and building accessibility information where it has been mapped.' },
  { id: 'zoom', category: 'Accessibility', question: 'Can I zoom the map?', answer: 'Yes. Use the map controls to zoom and inspect campus areas in more detail.' },
  { id: 'phone', category: 'Accessibility', question: 'Can I use the application on a phone?', answer: 'Yes. The interface is designed to adapt to smaller screens for mobile campus navigation.' },
  { id: 'dark-mode', category: 'Accessibility', question: 'Does the application support dark mode?', answer: 'Yes. Use the theme control to switch between light and dark modes.' },
  { id: 'what-is-this', category: 'General', question: 'What is this application?', answer: 'CUSTECH Navigator is an offline campus navigation system with an interactive map, building information, search and route guidance.' },
  { id: 'who-for', category: 'General', question: 'Who is this application designed for?', answer: 'It is designed for CUSTECH students, staff and visitors who need help finding campus buildings and facilities.' },
  { id: 'coverage', category: 'General', question: 'Which campus does it cover?', answer: 'The application covers Confluence University of Science and Technology (CUSTECH), Osara, Kogi State.' },
  { id: 'accuracy', category: 'General', question: 'How accurate are the routes?', answer: 'Routes are calculated from the mapped campus paths and building entrances. Follow on-site signage and use judgement where campus conditions have changed.' },
  { id: 'updates', category: 'General', question: 'How often is the map updated?', answer: 'Map accuracy improves whenever the project data is updated to reflect verified campus changes.' },
  { id: 'visitors', category: 'General', question: 'Can visitors use this application?', answer: 'Yes. Visitors can search for facilities, view building details and plan a route between mapped locations.' },
];
