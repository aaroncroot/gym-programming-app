const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const exercises = [
  // ===== STRENGTH TRAINING - BARBELL =====
  {
    name: "Back Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Stand with feet shoulder-width apart, barbell on upper back. Lower into squat position, keeping chest up and knees in line with toes. Return to standing position.",
    videoUrl: ""
  },
  {
    name: "Deadlift",
    category: "strength",
    muscleGroup: "back",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Stand with feet hip-width apart, barbell on ground. Bend at hips and knees, grip barbell. Lift by extending hips and knees, keeping bar close to body.",
    videoUrl: ""
  },
  {
    name: "Bench Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: "Lie on bench, feet flat on ground. Grip barbell slightly wider than shoulders. Lower bar to chest, then press back up to starting position.",
    videoUrl: ""
  },
  {
    name: "Overhead Press",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: "Stand with feet shoulder-width apart, barbell at shoulder level. Press barbell overhead, extending arms fully. Lower back to starting position.",
    videoUrl: ""
  },
  {
    name: "Romanian Deadlift",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: "Stand with feet hip-width apart, barbell in front of thighs. Hinge at hips, lowering bar along legs. Return to standing position by extending hips.",
    videoUrl: ""
  },

  // ===== STRENGTH TRAINING - DUMBBELLS =====
  {
    name: "Dumbbell Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Hold dumbbells at sides, feet shoulder-width apart. Lower into squat position, keeping chest up. Return to standing position.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Bench Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Lie on bench, dumbbells at shoulder level. Press dumbbells up, extending arms fully. Lower back to starting position.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Bend forward at hips, support with one hand on bench. Pull dumbbell up to hip, keeping elbow close to body. Lower and repeat.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Shoulder Press",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Sit or stand with dumbbells at shoulder level. Press dumbbells overhead, extending arms fully. Lower back to starting position.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Bicep Curl",
    category: "strength",
    muscleGroup: "arms",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Stand with dumbbells at sides, palms facing forward. Curl dumbbells up to shoulders, keeping elbows at sides. Lower and repeat.",
    videoUrl: ""
  },

  // ===== OLYMPIC LIFTING =====
  {
    name: "Snatch",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Start with barbell on ground, feet hip-width apart. Explosively lift bar overhead in one motion, catching it in overhead squat position.",
    videoUrl: ""
  },
  {
    name: "Clean & Jerk",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Clean: Pull bar to shoulders, catch in front rack position. Jerk: Press bar overhead, splitting legs forward and back.",
    videoUrl: ""
  },
  {
    name: "Power Clean",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Explosively pull barbell from ground to shoulders, catching in power position (not full squat).",
    videoUrl: ""
  },
  {
    name: "Hang Snatch",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Start with barbell at mid-thigh level. Explosively lift bar overhead in one motion, catching in overhead position.",
    videoUrl: ""
  },

  // ===== CROSSFIT MOVEMENTS =====
  {
    name: "Burpee",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Start standing, drop to push-up position, perform push-up, jump feet forward, then jump up with arms overhead.",
    videoUrl: ""
  },
  {
    name: "Wall Ball",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "medicine-ball",
    difficulty: "intermediate",
    instructions: "Hold medicine ball at chest, squat down, then explosively stand and throw ball to target on wall. Catch and repeat.",
    videoUrl: ""
  },
  {
    name: "Box Jump",
    category: "cardio",
    muscleGroup: "legs",
    equipment: "raised-platform-box",
    difficulty: "intermediate",
    instructions: "Stand facing box, jump onto box with both feet, landing softly. Step or jump back down and repeat.",
    videoUrl: ""
  },
  {
    name: "Thruster",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Hold dumbbells at shoulders, squat down, then explosively stand and press dumbbells overhead simultaneously.",
    videoUrl: ""
  },
  {
    name: "Kettlebell Swing",
    category: "strength",
    muscleGroup: "legs",
    equipment: "kettlebell",
    difficulty: "intermediate",
    instructions: "Stand with feet shoulder-width apart, kettlebell between legs. Swing kettlebell forward and up to chest level using hip drive.",
    videoUrl: ""
  },

  // ===== CARDIO EXERCISES =====
  {
    name: "Running",
    category: "cardio",
    muscleGroup: "cardio",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Maintain upright posture, land midfoot, keep arms relaxed at sides. Start with walking and gradually increase pace.",
    videoUrl: ""
  },
  {
    name: "Cycling",
    category: "cardio",
    muscleGroup: "cardio",
    equipment: "cardio-machine",
    difficulty: "beginner",
    instructions: "Adjust seat height so knee is slightly bent at bottom of pedal stroke. Maintain steady cadence and resistance.",
    videoUrl: ""
  },
  {
    name: "Rowing",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "cardio-machine",
    difficulty: "intermediate",
    instructions: "Start with legs extended, arms forward. Drive with legs, then lean back and pull arms to chest. Return to start position.",
    videoUrl: ""
  },
  {
    name: "Jump Rope",
    category: "cardio",
    muscleGroup: "cardio",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Hold rope handles, jump with both feet, keeping jumps small and rhythmic. Land softly on balls of feet.",
    videoUrl: ""
  },
  {
    name: "Mountain Climbers",
    category: "cardio",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Start in plank position, rapidly alternate bringing knees to chest, maintaining plank position throughout.",
    videoUrl: ""
  },

  // ===== FLEXIBILITY/MOBILITY =====
  {
    name: "Forward Lunge",
    category: "flexibility",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Step forward with one leg, lower hips until both knees are bent at 90 degrees. Keep front knee over ankle.",
    videoUrl: ""
  },
  {
    name: "Hip Flexor Stretch",
    category: "flexibility",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Kneel on one knee, other foot forward. Lean forward to stretch hip flexor of back leg. Hold for 30 seconds.",
    videoUrl: ""
  },
  {
    name: "Cat-Cow Stretch",
    category: "flexibility",
    muscleGroup: "back",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "On hands and knees, alternate between arching back (cow) and rounding back (cat). Move slowly and controlled.",
    videoUrl: ""
  },
  {
    name: "Child's Pose",
    category: "flexibility",
    muscleGroup: "back",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Kneel on ground, sit back on heels, reach arms forward, lowering chest toward ground. Hold for 30-60 seconds.",
    videoUrl: ""
  },
  {
    name: "Downward Dog",
    category: "flexibility",
    muscleGroup: "full-body",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Start on hands and knees, lift hips up and back, forming inverted V shape. Press heels toward ground.",
    videoUrl: ""
  },

  // ===== MACHINE EXERCISES =====
  {
    name: "Leg Press",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit in machine, feet on platform shoulder-width apart. Press platform away by extending knees and hips. Return slowly.",
    videoUrl: ""
  },
  {
    name: "Lat Pulldown",
    category: "strength",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit at machine, grip bar wider than shoulders. Pull bar down to upper chest, keeping chest up. Return slowly.",
    videoUrl: ""
  },
  {
    name: "Chest Press Machine",
    category: "strength",
    muscleGroup: "chest",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit in machine, adjust seat height. Press handles forward, extending arms fully. Return slowly to starting position.",
    videoUrl: ""
  },
  {
    name: "Seated Row Machine",
    category: "strength",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit at machine, grip handles. Pull handles toward chest, squeezing shoulder blades together. Return slowly.",
    videoUrl: ""
  },
  {
    name: "Leg Extension",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit in machine, adjust pad position. Extend knees to lift weight, then lower slowly back to starting position.",
    videoUrl: ""
  },

  // ===== CABLE EXERCISES =====
  {
    name: "Cable Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Sit at cable machine, grip handle. Pull handle toward chest, squeezing shoulder blades. Return slowly.",
    videoUrl: ""
  },
  {
    name: "Cable Chest Fly",
    category: "strength",
    muscleGroup: "chest",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand between cable pulleys, arms extended. Bring hands together in front of chest, then return to starting position.",
    videoUrl: ""
  },
  {
    name: "Cable Bicep Curl",
    category: "strength",
    muscleGroup: "arms",
    equipment: "cable",
    difficulty: "beginner",
    instructions: "Stand facing cable machine, grip handle. Curl handle toward shoulders, keeping elbows at sides. Return slowly.",
    videoUrl: ""
  },
  {
    name: "Cable Tricep Extension",
    category: "strength",
    muscleGroup: "arms",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand facing cable machine, grip handle overhead. Extend arms downward, keeping upper arms stationary.",
    videoUrl: ""
  },
  {
    name: "Cable Woodchop",
    category: "strength",
    muscleGroup: "core",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand sideways to cable machine, grip handle with both hands. Rotate torso and bring handle across body diagonally.",
    videoUrl: ""
  },

  // ===== BODYWEIGHT EXERCISES =====
  {
    name: "Push-up",
    category: "strength",
    muscleGroup: "chest",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Start in plank position, hands slightly wider than shoulders. Lower chest to ground, then push back up.",
    videoUrl: ""
  },
  {
    name: "Pull-up",
    category: "strength",
    muscleGroup: "back",
    equipment: "pull-up-bar",
    difficulty: "advanced",
    instructions: "Hang from pull-up bar, hands wider than shoulders. Pull body up until chin is over bar, then lower slowly.",
    videoUrl: ""
  },
  {
    name: "Dip",
    category: "strength",
    muscleGroup: "arms",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Support body on parallel bars, arms extended. Lower body by bending elbows, then push back up.",
    videoUrl: ""
  },
  {
    name: "Plank",
    category: "strength",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Hold body in straight line from head to heels, supporting on forearms and toes. Maintain neutral spine.",
    videoUrl: ""
  },
  {
    name: "Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: "Stand with feet shoulder-width apart. Lower into squat position, keeping chest up and knees in line with toes.",
    videoUrl: ""
  },

  // ===== KETTLEBELL EXERCISES =====
  {
    name: "Kettlebell Goblet Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "kettlebell",
    difficulty: "beginner",
    instructions: "Hold kettlebell at chest level, feet shoulder-width apart. Squat down, keeping kettlebell close to chest.",
    videoUrl: ""
  },
  {
    name: "Kettlebell Turkish Get-up",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "kettlebell",
    difficulty: "advanced",
    instructions: "Lie on back, hold kettlebell overhead with one arm. Stand up while keeping kettlebell overhead, then reverse movement.",
    videoUrl: ""
  },
  {
    name: "Kettlebell Clean",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "kettlebell",
    difficulty: "intermediate",
    instructions: "Start with kettlebell between legs. Explosively lift kettlebell to shoulder level, catching it in rack position.",
    videoUrl: ""
  },
  {
    name: "Kettlebell Snatch",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "kettlebell",
    difficulty: "advanced",
    instructions: "Start with kettlebell between legs. Explosively lift kettlebell overhead in one motion, catching it overhead.",
    videoUrl: ""
  },

  // ===== RESISTANCE BAND EXERCISES =====
  {
    name: "Band Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "resistance-band",
    difficulty: "beginner",
    instructions: "Stand on resistance band, hold handles at shoulders. Perform squat while maintaining tension on band.",
    videoUrl: ""
  },
  {
    name: "Band Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "resistance-band",
    difficulty: "beginner",
    instructions: "Anchor band at chest height, step back to create tension. Pull handles toward chest, squeezing shoulder blades.",
    videoUrl: ""
  },
  {
    name: "Band Chest Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "resistance-band",
    difficulty: "beginner",
    instructions: "Anchor band behind you at shoulder height. Press handles forward, extending arms fully.",
    videoUrl: ""
  },
  {
    name: "Band Lateral Raise",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "resistance-band",
    difficulty: "beginner",
    instructions: "Stand on band, hold handles at sides. Raise arms out to sides to shoulder level, then lower slowly.",
    videoUrl: ""
  },

  // ===== STABILITY BALL EXERCISES =====
  {
    name: "Stability Ball Crunch",
    category: "strength",
    muscleGroup: "core",
    equipment: "stability-ball",
    difficulty: "beginner",
    instructions: "Lie on stability ball, feet on ground. Perform crunch motion, lifting shoulders off ball.",
    videoUrl: ""
  },
  {
    name: "Stability Ball Bridge",
    category: "strength",
    muscleGroup: "legs",
    equipment: "stability-ball",
    difficulty: "intermediate",
    instructions: "Lie on back, feet on stability ball. Lift hips to form bridge, keeping ball stable.",
    videoUrl: ""
  },
  {
    name: "Stability Ball Push-up",
    category: "strength",
    muscleGroup: "chest",
    equipment: "stability-ball",
    difficulty: "advanced",
    instructions: "Place hands on stability ball, feet on ground. Perform push-up while maintaining balance on ball.",
    videoUrl: ""
  },

  // ===== MEDICINE BALL EXERCISES =====
  {
    name: "Medicine Ball Slam",
    category: "strength",
    muscleGroup: "full-body",
    equipment: "medicine-ball",
    difficulty: "intermediate",
    instructions: "Hold medicine ball overhead, slam it to ground forcefully, then catch and repeat.",
    videoUrl: ""
  },
  {
    name: "Medicine Ball Russian Twist",
    category: "strength",
    muscleGroup: "core",
    equipment: "medicine-ball",
    difficulty: "intermediate",
    instructions: "Sit with knees bent, hold medicine ball at chest. Rotate torso side to side, touching ball to ground.",
    videoUrl: ""
  },
  {
    name: "Medicine Ball Chest Pass",
    category: "strength",
    muscleGroup: "chest",
    equipment: "medicine-ball",
    difficulty: "intermediate",
    instructions: "Stand facing wall, hold medicine ball at chest. Explosively throw ball to wall, catch and repeat.",
    videoUrl: ""
  },

  // ===== TRX EXERCISES =====
  {
    name: "TRX Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "trx",
    difficulty: "beginner",
    instructions: "Hold TRX handles, lean back with body straight. Pull body up by bending elbows, then lower slowly.",
    videoUrl: ""
  },
  {
    name: "TRX Push-up",
    category: "strength",
    muscleGroup: "chest",
    equipment: "trx",
    difficulty: "advanced",
    instructions: "Place feet in TRX straps, hands on ground. Perform push-up while maintaining balance.",
    videoUrl: ""
  },
  {
    name: "TRX Pike",
    category: "strength",
    muscleGroup: "core",
    equipment: "trx",
    difficulty: "advanced",
    instructions: "Place feet in TRX straps, hands on ground in plank position. Pike hips up toward ceiling.",
    videoUrl: ""
  },

  // ===== BOSU EXERCISES =====
  {
    name: "BOSU Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "bosu-trainer",
    difficulty: "intermediate",
    instructions: "Stand on BOSU dome side, feet shoulder-width apart. Perform squat while maintaining balance.",
    videoUrl: ""
  },
  {
    name: "BOSU Push-up",
    category: "strength",
    muscleGroup: "chest",
    equipment: "bosu-trainer",
    difficulty: "intermediate",
    instructions: "Place hands on BOSU dome side, feet on ground. Perform push-up while maintaining balance.",
    videoUrl: ""
  },
  {
    name: "BOSU Plank",
    category: "strength",
    muscleGroup: "core",
    equipment: "bosu-trainer",
    difficulty: "intermediate",
    instructions: "Place forearms on BOSU dome side, feet on ground. Hold plank position while maintaining balance.",
    videoUrl: ""
  },

  // ===== HEAVY ROPES EXERCISES =====
  {
    name: "Rope Slams",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "heavy-ropes",
    difficulty: "intermediate",
    instructions: "Hold heavy ropes, alternate slamming them to ground in wave motion.",
    videoUrl: ""
  },
  {
    name: "Rope Waves",
    category: "cardio",
    muscleGroup: "arms",
    equipment: "heavy-ropes",
    difficulty: "beginner",
    instructions: "Hold heavy ropes, create wave motion by moving arms up and down alternately.",
    videoUrl: ""
  },
  {
    name: "Rope Circles",
    category: "cardio",
    muscleGroup: "shoulders",
    equipment: "heavy-ropes",
    difficulty: "intermediate",
    instructions: "Hold heavy ropes, make circular motions with both arms simultaneously.",
    videoUrl: ""
  },

  // ===== RENAISSANCE PERIODIZATION INSPIRED EXERCISES =====
  // Based on RP Strength Training Made Simple and Hypertrophy Made Simple principles
  
  // ===== ADVANCED BARBELL COMPOUNDS (RP Style) =====
  {
    name: "Pause Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Perform back squat with 2-3 second pause at bottom position. Maintain tension throughout pause.",
    videoUrl: ""
  },
  {
    name: "Tempo Deadlift",
    category: "strength",
    muscleGroup: "back",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Lower barbell with 3-4 second controlled descent, then explosively lift. Focus on eccentric control.",
    videoUrl: ""
  },
  {
    name: "Spoto Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Bench press variation with pause 1-2 inches above chest. Eliminates stretch reflex for pure strength.",
    videoUrl: ""
  },
  {
    name: "Pin Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Set safety pins at chest level. Press barbell from pins, eliminating bottom position stretch reflex.",
    videoUrl: ""
  },
  {
    name: "Zercher Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Hold barbell in crook of elbows, close to chest. Squat while maintaining upright torso position.",
    videoUrl: ""
  },

  // ===== RP HYPERTROPHY FOCUSED MOVEMENTS =====
  {
    name: "Dumbbell Incline Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Lie on incline bench (30-45 degrees), press dumbbells from shoulder level to full extension.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Decline Press",
    category: "strength",
    muscleGroup: "chest",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Lie on decline bench, press dumbbells from lower chest position to full extension.",
    videoUrl: ""
  },
  {
    name: "Cable Crossover",
    category: "strength",
    muscleGroup: "chest",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand between cable pulleys, arms extended. Bring hands together in front of chest in arc motion.",
    videoUrl: ""
  },
  {
    name: "Lat Pulldown (Wide Grip)",
    category: "strength",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: "intermediate",
    instructions: "Grip bar wider than shoulders, pull bar to upper chest while maintaining upright posture.",
    videoUrl: ""
  },
  {
    name: "Lat Pulldown (Close Grip)",
    category: "strength",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: "intermediate",
    instructions: "Grip bar with hands closer than shoulders, pull to upper chest focusing on lower lat engagement.",
    videoUrl: ""
  },
  {
    name: "T-Bar Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: "intermediate",
    instructions: "Stand over T-bar machine, grip handles and row weight to lower chest, squeezing shoulder blades.",
    videoUrl: ""
  },
  {
    name: "Seated Cable Row",
    category: "strength",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Sit at cable machine, pull handle to lower chest while maintaining neutral spine position.",
    videoUrl: ""
  },

  // ===== RP SHOULDER DEVELOPMENT =====
  {
    name: "Military Press",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Stand with barbell at shoulder level, press overhead with strict form, no leg drive.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Lateral Raise",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Stand with dumbbells at sides, raise arms out to sides to shoulder level, control descent.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Front Raise",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Stand with dumbbells in front of thighs, raise arms forward to shoulder level.",
    videoUrl: ""
  },
  {
    name: "Dumbbell Rear Delt Fly",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Bend forward at hips, raise dumbbells out to sides, focusing on rear deltoid engagement.",
    videoUrl: ""
  },
  {
    name: "Cable Lateral Raise",
    category: "strength",
    muscleGroup: "shoulders",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand sideways to cable machine, raise arm out to side maintaining constant tension.",
    videoUrl: ""
  },

  // ===== RP ARM DEVELOPMENT =====
  {
    name: "Barbell Curl",
    category: "strength",
    muscleGroup: "arms",
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: "Stand with barbell at thighs, curl weight to shoulders while keeping elbows at sides.",
    videoUrl: ""
  },
  {
    name: "Hammer Curl",
    category: "strength",
    muscleGroup: "arms",
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: "Hold dumbbells with palms facing each other, curl to shoulders maintaining neutral grip.",
    videoUrl: ""
  },
  {
    name: "Preacher Curl",
    category: "strength",
    muscleGroup: "arms",
    equipment: "machine",
    difficulty: "intermediate",
    instructions: "Sit at preacher bench, curl weight with arms supported, focusing on bicep isolation.",
    videoUrl: ""
  },
  {
    name: "Close-Grip Bench Press",
    category: "strength",
    muscleGroup: "arms",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Bench press with hands closer than shoulder width, focusing on tricep engagement.",
    videoUrl: ""
  },
  {
    name: "Diamond Push-up",
    category: "strength",
    muscleGroup: "arms",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Form diamond shape with hands under chest, perform push-up focusing on tricep engagement.",
    videoUrl: ""
  },
  {
    name: "Cable Tricep Pushdown",
    category: "strength",
    muscleGroup: "arms",
    equipment: "cable",
    difficulty: "beginner",
    instructions: "Stand at cable machine, push bar down while keeping upper arms stationary.",
    videoUrl: ""
  },

  // ===== RP LEG DEVELOPMENT =====
  {
    name: "Front Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "advanced",
    instructions: "Hold barbell in front rack position, squat while maintaining upright torso and elbows up.",
    videoUrl: ""
  },
  {
    name: "Romanian Deadlift",
    category: "strength",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: "Stand with barbell in front of thighs, hinge at hips lowering bar along legs, return to standing.",
    videoUrl: ""
  },
  {
    name: "Bulgarian Split Squat",
    category: "strength",
    muscleGroup: "legs",
    equipment: "dumbbells",
    difficulty: "advanced",
    instructions: "Place rear foot on bench behind you, perform split squat with dumbbells at sides.",
    videoUrl: ""
  },
  {
    name: "Walking Lunge",
    category: "strength",
    muscleGroup: "legs",
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: "Hold dumbbells at sides, step forward into lunge, alternate legs while walking forward.",
    videoUrl: ""
  },
  {
    name: "Leg Press",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit in leg press machine, press platform away by extending knees and hips.",
    videoUrl: ""
  },
  {
    name: "Leg Extension",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Sit in machine, extend knees to lift weight, focusing on quadricep isolation.",
    videoUrl: ""
  },
  {
    name: "Leg Curl",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Lie face down on machine, curl weight by bending knees, focusing on hamstring isolation.",
    videoUrl: ""
  },
  {
    name: "Calf Raise",
    category: "strength",
    muscleGroup: "legs",
    equipment: "machine",
    difficulty: "beginner",
    instructions: "Stand on machine platform, raise heels up and down, focusing on calf muscle engagement.",
    videoUrl: ""
  },

  // ===== RP CORE DEVELOPMENT =====
  {
    name: "Cable Woodchop",
    category: "strength",
    muscleGroup: "core",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand sideways to cable machine, rotate torso and bring handle across body diagonally.",
    videoUrl: ""
  },
  {
    name: "Cable Rotation",
    category: "strength",
    muscleGroup: "core",
    equipment: "cable",
    difficulty: "intermediate",
    instructions: "Stand facing cable machine, rotate torso while keeping hips stable.",
    videoUrl: ""
  },
  {
    name: "Hanging Leg Raise",
    category: "strength",
    muscleGroup: "core",
    equipment: "pull-up-bar",
    difficulty: "advanced",
    instructions: "Hang from pull-up bar, raise legs to parallel or higher while maintaining control.",
    videoUrl: ""
  },
  {
    name: "Russian Twist",
    category: "strength",
    muscleGroup: "core",
    equipment: "medicine-ball",
    difficulty: "intermediate",
    instructions: "Sit with knees bent, hold medicine ball, rotate torso side to side touching ball to ground.",
    videoUrl: ""
  },
  {
    name: "Plank with Leg Lift",
    category: "strength",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Hold plank position, alternate lifting legs while maintaining stable core position.",
    videoUrl: ""
  },

  // ===== RP CARDIO & CONDITIONING =====
  {
    name: "Assault Bike",
    category: "cardio",
    muscleGroup: "cardio",
    equipment: "cardio-machine",
    difficulty: "intermediate",
    instructions: "Pedal and push/pull handles simultaneously for full-body cardio conditioning.",
    videoUrl: ""
  },
  {
    name: "Rowing Machine",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "cardio-machine",
    difficulty: "intermediate",
    instructions: "Drive with legs, lean back, pull arms to chest, return to start position in sequence.",
    videoUrl: ""
  },
  {
    name: "Battle Ropes",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "heavy-ropes",
    difficulty: "intermediate",
    instructions: "Hold heavy ropes, create alternating wave motions for upper body conditioning.",
    videoUrl: ""
  },
  {
    name: "Box Jump",
    category: "cardio",
    muscleGroup: "legs",
    equipment: "raised-platform-box",
    difficulty: "intermediate",
    instructions: "Stand facing box, jump onto box with both feet, land softly and step back down.",
    videoUrl: ""
  },
  {
    name: "Burpee",
    category: "cardio",
    muscleGroup: "full-body",
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: "Drop to push-up position, perform push-up, jump feet forward, then jump up with arms overhead.",
    videoUrl: ""
  }
];

// Function to seed exercises
const seedExercises = async () => {
  try {
    console.log('Starting exercise seeding...');
    
    // Clear existing exercises
    await Exercise.deleteMany({});
    console.log('Cleared existing exercises');
    
    // Insert new exercises
    const createdExercises = await Exercise.insertMany(exercises);
    console.log(`Successfully seeded ${createdExercises.length} exercises`);
    
    // Log some statistics
    const categories = await Exercise.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const muscleGroups = await Exercise.aggregate([
      { $group: { _id: '$muscleGroup', count: { $sum: 1 } } }
    ]);
    
    const equipment = await Exercise.aggregate([
      { $group: { _id: '$equipment', count: { $sum: 1 } } }
    ]);
    
    console.log('\nExercise Statistics:');
    console.log('Categories:', categories);
    console.log('Muscle Groups:', muscleGroups);
    console.log('Equipment Types:', equipment);
    
    mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding exercises:', error);
    mongoose.connection.close();
  }
};

// Run the seed function
seedExercises();
