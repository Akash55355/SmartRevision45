/* ==========================================================================
   questions.js
   - All quiz questions stored here, separated by subject.
   - Each subject is an array of question objects.
   - Each question object format:
     {
       question: "Question text",
       options: ["Option A", "Option B", "Option C", "Option D"],
       answer: 1,        // index (0-based) of the correct option in `options`
       time: 20          // optional: seconds allowed for this question (used by script.js)
     }
   - NOTE: Subject keys must match the `data-subject` attributes used in index.html:
     'history', 'science', 'mathematics', 'general'
   - You can extend, remove, or edit questions here; keep the same object shape.
   ========================================================================== */

const QUESTIONS = {
  history: [
    {
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
      answer: 1,
      time: 20
    },
    {
      question: "Which ancient civilization built the pyramids at Giza?",
      options: ["Romans", "Greeks", "Egyptians", "Babylonians"],
      answer: 2,
      time: 20
    },
    {
      question: "In which year did World War II end?",
      options: ["1945", "1939", "1918", "1950"],
      answer: 0,
      time: 20
    },
    {
      question: "Who was known as the 'Maid of Orléans' and led French troops during the Hundred Years' War?",
      options: ["Catherine the Great", "Joan of Arc", "Isabella I", "Eleanor of Aquitaine"],
      answer: 1,
      time: 20
    },
    {
      question: "Which empire was ruled by Genghis Khan?",
      options: ["Ottoman Empire", "Mongol Empire", "Roman Empire", "Persian Empire"],
      answer: 1,
      time: 20
    },
    {
      question: "The Renaissance began in which country in the 14th–15th century?",
      options: ["France", "England", "Italy", "Spain"],
      answer: 2,
      time: 20
    },
    {
      question: "Which event is commonly used to mark the beginning of the modern era in 1789?",
      options: ["American Revolution", "French Revolution", "Industrial Revolution", "Russian Revolution"],
      answer: 1,
      time: 20
    },
    {
      question: "Who was the British Prime Minister during most of World War II?",
      options: ["Neville Chamberlain", "Winston Churchill", "Clement Attlee", "Harold Macmillan"],
      answer: 1,
      time: 20
    },
    {
      question: "Which wall separated East and West Berlin from 1961 to 1989?",
      options: ["Great Wall", "Berlin Wall", "Hadrian's Wall", "Wailing Wall"],
      answer: 1,
      time: 20
    },
    {
      question: "Which famous ship sank on its maiden voyage in 1912 after hitting an iceberg?",
      options: ["Lusitania", "Britannic", "Titanic", "Mayflower"],
      answer: 2,
      time: 20
    }
  ],

  science: [
    {
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      answer: 0,
      time: 20
    },
    {
      question: "What force keeps planets in orbit around the Sun?",
      options: ["Magnetism", "Friction", "Gravity", "Radiation"],
      answer: 2,
      time: 20
    },
    {
      question: "Which organelle is known as the 'powerhouse of the cell'?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
      answer: 1,
      time: 20
    },
    {
      question: "What is the speed of light in vacuum approximately?",
      options: ["300,000 km/s", "150,000 km/s", "30,000 km/s", "3,000 km/s"],
      answer: 0,
      time: 20
    },
    {
      question: "Which gas do plants primarily absorb from the atmosphere for photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      answer: 2,
      time: 20
    },
    {
      question: "What is the center of an atom called?",
      options: ["Electron", "Proton", "Nucleus", "Neutron"],
      answer: 2,
      time: 20
    },
    {
      question: "Which of the following is a non-renewable energy source?",
      options: ["Solar", "Wind", "Coal", "Hydroelectric"],
      answer: 2,
      time: 20
    },
    {
      question: "What phenomenon explains why we see a rainbow?",
      options: ["Reflection only", "Refraction and dispersion", "Diffraction", "Interference"],
      answer: 1,
      time: 20
    },
    {
      question: "What is the pH value of pure water at 25°C (neutral)?",
      options: ["0", "7", "14", "1"],
      answer: 1,
      time: 20
    },
    {
      question: "Which particle has a negative electric charge?",
      options: ["Proton", "Neutron", "Electron", "Photon"],
      answer: 2,
      time: 20
    }
  ],

  mathematics: [
    {
      question: "What is 12 × 8?",
      options: ["96", "88", "108", "86"],
      answer: 0,
      time: 20
    },
    {
      question: "Solve for x: 2x + 5 = 13.",
      options: ["4", "6", "3", "5"],
      answer: 0,
      time: 20
    },
    {
      question: "What is the value of π (pi) approximately?",
      options: ["2.14", "3.14", "4.13", "3.41"],
      answer: 1,
      time: 20
    },
    {
      question: "A right triangle has legs 3 and 4. What is the hypotenuse?",
      options: ["5", "6", "7", "4"],
      answer: 0,
      time: 20
    },
    {
      question: "What is 15% of 200?",
      options: ["20", "25", "30", "35"],
      answer: 2,
      time: 20
    },
    {
      question: "What is the next number in the sequence: 2, 4, 8, 16, ?",
      options: ["20", "24", "32", "34"],
      answer: 2,
      time: 20
    },
    {
      question: "What is the area of a rectangle with width 5 and height 9?",
      options: ["14", "45", "36", "40"],
      answer: 1,
      time: 20
    },
    {
      question: "Which property states that a + b = b + a?",
      options: ["Distributive", "Commutative", "Associative", "Identity"],
      answer: 1,
      time: 20
    },
    {
      question: "What is 7 squared?",
      options: ["14", "49", "21", "57"],
      answer: 1,
      time: 20
    },
    {
      question: "If x = 3 and y = 4, what is x^2 + y^2?",
      options: ["12", "25", "9", "7"],
      answer: 1,
      time: 20
    }
  ],

  general: [
    {
      question: "What is the capital city of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answer: 2,
      time: 20
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      answer: 1,
      time: 20
    },
    {
      question: "Which language is primarily spoken in Brazil?",
      options: ["Spanish", "Portuguese", "English", "French"],
      answer: 1,
      time: 20
    },
    {
      question: "What does HTTP stand for in web addresses?",
      options: [
        "HyperText Transfer Protocol",
        "High Transfer Text Protocol",
        "Hyperlink Transfer Program",
        "HyperText Transmission Process"
      ],
      answer: 0,
      time: 20
    },
    {
      question: "Which animal is known as the 'King of the Jungle'?",
      options: ["Tiger", "Elephant", "Lion", "Gorilla"],
      answer: 2,
      time: 20
    },
    {
      question: "Which country hosts the Great Barrier Reef?",
      options: ["Australia", "USA", "South Africa", "India"],
      answer: 0,
      time: 20
    },
    {
      question: "What color do you get when you mix red and white?",
      options: ["Pink", "Purple", "Orange", "Brown"],
      answer: 0,
      time: 20
    },
    {
      question: "How many continents are there on Earth?",
      options: ["5", "6", "7", "8"],
      answer: 2,
      time: 20
    },
    {
      question: "Which company created the iPhone?",
      options: ["Google", "Microsoft", "Apple", "Samsung"],
      answer: 2,
      time: 20
    },
    {
      question: "What is the common name for dried plums?",
      options: ["Raisins", "Prunes", "Dates", "Figs"],
      answer: 1,
      time: 20
    }
  ]
};

/* Make QUESTIONS available globally (for older browsers or other scripts) */
window.QUESTIONS = QUESTIONS;
