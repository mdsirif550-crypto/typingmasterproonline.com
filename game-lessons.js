window.TypingGameLessons = (() => {
  const lessonDurationMs = 5 * 60 * 60 * 1000;
  const lessons = [
    {
      title: "A New Road",
      text: "A new road can feel uncertain, but every journey begins with one careful step. Keep your eyes ahead, follow the signs, and give yourself room to learn. A steady pace helps you notice each turn and reach your destination with confidence."
    },
    {
      title: "The Little Seed",
      text: "Mina planted a small seed beside the sunny window. Each morning she gave it water and watched for a green shoot. After many quiet days, two bright leaves appeared. Her patience showed that small acts of care can help new ideas grow."
    },
    {
      title: "The Village Market",
      text: "The village market opened early, filling the street with friendly voices. Farmers arranged fresh fruit, warm bread, and colorful flowers on their tables. Neighbors greeted one another and shared news. By noon, the busy square felt like the heart of the town."
    },
    {
      title: "A Clear Plan",
      text: "A clear plan makes a difficult task easier to begin. Write down the first step, gather what you need, and work without rushing. If something goes wrong, pause and choose another way. Good progress comes from patient effort, useful questions, and steady practice."
    },
    {
      title: "A Book by the Window",
      text: "The library was quiet except for the soft turning of pages. Rafi chose a book about distant oceans and found a map inside. He traced the waves with one finger and imagined ships crossing the blue water. A single story made the afternoon feel like an adventure."
    },
    {
      title: "After the Rain",
      text: "Rain tapped gently on the roof while clouds covered the hills. Inside, a family prepared tea and listened to the changing weather. When the shower ended, sunlight returned and tiny drops shone on every leaf. The fresh air made the whole garden smell sweet."
    },
    {
      title: "Working as a Team",
      text: "Good teamwork starts when people listen to one another. Each person brings a different idea, and every useful suggestion deserves attention. A shared plan can turn many small efforts into one strong result. Respect and clear words help a team move forward together."
    },
    {
      title: "A Morning Ride",
      text: "A bicycle rolled along the quiet path as morning light spread across the fields. Birds called from the trees, and a cool breeze followed the rider. At the bridge, the river reflected the bright sky. The simple ride became a peaceful start to the day."
    },
    {
      title: "A Helpful Message",
      text: "Before sending an important message, read it once more. Check names, dates, and the details that help another person understand. A kind greeting can make a short note feel warm. Clear writing saves time and helps people work well together."
    },
    {
      title: "The First Pancake",
      text: "The young cook measured flour, milk, and a little sugar into a bowl. She stirred slowly until the mixture became smooth, then poured it into a warm pan. Soon, a sweet smell filled the kitchen. Sharing the first pancake made everyone smile."
    },
    {
      title: "The Lighthouse",
      text: "A lighthouse stood above the rocky shore and watched over the dark water. Each night its bright beam crossed the waves to guide boats safely home. The keeper checked the lamp and polished the glass. Careful work protected travelers through every storm."
    },
    {
      title: "A Careful Computer Check",
      text: "When the computer seemed slow, Hasan closed unused windows and saved his work. He checked the cables, restarted the program, and waited calmly. The screen returned to normal. A careful check solved the problem without losing the notes he needed for class."
    },
    {
      title: "The Changing Park",
      text: "The park looked different in every season. Spring brought flowers, summer filled the trees with shade, and autumn painted the leaves gold. In winter, the quiet paths rested beneath a cool sky. Every visit offered a new detail to notice and enjoy."
    },
    {
      title: "Practice with Care",
      text: "Practice is most useful when you pay attention to each attempt. Notice which words feel difficult, then repeat them slowly and accurately. Take a short rest when your hands grow tired. Small improvements build confidence and make the next lesson easier."
    },
    {
      title: "An Honest Choice",
      text: "Nila found a lost wallet beside the bus stop. She checked for a name, then gave it to the station office instead of keeping it. Later, the owner returned with a grateful smile. Honesty can turn a worrying moment into a kind memory."
    },
    {
      title: "The Paper Bridge",
      text: "The science club built a paper bridge for a small test. They folded each sheet, placed books on top, and recorded what happened. Their first design bent, so they changed the shape and tried again. Careful experiments helped them discover a stronger bridge."
    },
    {
      title: "Morning by the Bay",
      text: "At sunrise, fishing boats moved slowly across the quiet bay. The water glowed beneath the first light, and distant hills appeared through the mist. A fisherman checked his nets while the town began to wake. The calm morning promised a day of steady work."
    },
    {
      title: "A Goal for Today",
      text: "A good goal should be clear enough to follow and small enough to begin today. Choose one task, decide when to do it, and track your progress. If your plan needs to change, adjust it without giving up. Consistent effort makes a distant goal feel closer."
    },
    {
      title: "The Town Clock",
      text: "The old clock in the town hall chimed each hour. People used its steady sound to meet friends, open shops, and catch the evening train. A repairer cleaned its gears and checked every hand. Keeping the clock in time helped the whole town stay connected."
    },
    {
      title: "A Playful Afternoon",
      text: "A friendly dog waited beside the garden gate while its owner gathered a ball. They ran across the grass, stopped to rest, and started again. The dog wagged its tail whenever the ball rolled nearby. A little play brought energy and joy to the afternoon."
    },
    {
      title: "Stars Above the Roof",
      text: "On a clear night, the stars appeared one by one above the rooftops. Far from bright city lights, the sky revealed a quiet pattern of distant suns. A teacher showed the children how to find the North Star. Looking upward made them curious about the universe."
    },
    {
      title: "Save Every Drop",
      text: "Fresh water is precious, so a small habit can make a difference. Turn off the tap while brushing your teeth and repair a dripping pipe. Use only what you need in the garden. Careful choices protect rivers and leave more clean water for everyone."
    },
    {
      title: "A Train to the Coast",
      text: "The train crossed green fields and passed small stations along the way. A child watched houses, trees, and bridges move beyond the window. At each stop, new passengers joined the journey. By the time the train reached the coast, the sky had turned a soft orange."
    },
    {
      title: "Help a Friend Learn",
      text: "When a friend is learning something new, offer patience instead of pressure. Explain one step at a time and let them try on their own. Celebrate effort, even when the result is not perfect. Helpful support can make a hard challenge feel possible."
    },
    {
      title: "Bread Before Dawn",
      text: "The baker woke before dawn to prepare bread for the neighborhood. He mixed the dough, waited for it to rise, and placed each loaf in the oven. Soon warm bread filled the shop with a comforting smell. Early care made breakfast special for many families."
    },
    {
      title: "Explore a New Place",
      text: "A map can help you explore, but it is wise to notice the world around you too. Check the street signs, remember familiar landmarks, and ask politely if you need directions. With a little planning, a new place becomes easier to understand and enjoy."
    },
    {
      title: "The School Garden",
      text: "The school garden gave students a place to learn outside the classroom. They planted herbs, removed weeds, and wrote notes about each change. Butterflies visited the bright flowers, while bees moved between them. Working together helped the garden grow and taught useful lessons."
    },
    {
      title: "Try One More Time",
      text: "An unexpected mistake can reveal what to practice next. Read the sentence again, find the difficult part, and try it with a relaxed hand. There is no need to hurry through the correction. Every careful retry helps your fingers remember the right pattern."
    },
    {
      title: "Music by the River",
      text: "The town held a music evening beside the river. Families brought chairs, and local players performed songs under strings of lights. Some people clapped along while others quietly listened. When the final tune ended, neighbors walked home with cheerful hearts."
    },
    {
      title: "Ready for the Journey",
      text: "Before a long trip, pack only what you need and check the weather. Keep your ticket safe, charge your phone, and leave enough time to reach the station. A calm start makes travel more pleasant. Good preparation lets you enjoy the journey instead of worrying about details."
    }
  ];
  const memoryStates = new Map();

  function getCurrentLesson(storageKey) {
    const now = Date.now();
    let state;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < lessons.length &&
          Number.isFinite(saved.changedAt)) {
        state = saved;
      }
    } catch (error) {
      console.error("Could not read the saved game lesson schedule:", error);
    }

    if (!state) state = memoryStates.get(storageKey);
    if (!state || now < state.changedAt) {
      state = { index: Math.floor(Math.random() * lessons.length), changedAt: now };
    } else if (now - state.changedAt >= lessonDurationMs) {
      const elapsedIntervals = Math.floor((now - state.changedAt) / lessonDurationMs);
      state = {
        index: (state.index + elapsedIntervals) % lessons.length,
        changedAt: state.changedAt + elapsedIntervals * lessonDurationMs
      };
    }

    memoryStates.set(storageKey, state);
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save the game lesson schedule:", error);
    }

    const lesson = lessons[state.index];
    return {
      ...lesson,
      index: state.index,
      sentences: lesson.text.match(/[^.!?]+[.!?]+/g).map(sentence => sentence.trim())
    };
  }

  return { getCurrentLesson, total: lessons.length, durationMs: lessonDurationMs };
})();
