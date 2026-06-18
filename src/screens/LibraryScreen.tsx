import React, { useState, useRef, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
}

interface ArticleItem {
  id: string;
  title: string;
  readTime: string;
  tag: string;
  tagColor: string;
  headerIcon: string;
  summary: string;
  content: string;
}

// ─── Video data ───────────────────────────────────────────────────────────────

const SCREEN_W   = Dimensions.get('window').width;
const VG_CARD_W  = Math.floor((SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2);
const VG_THUMB_H = Math.round(VG_CARD_W * 9 / 16);

const VIDEOS: VideoItem[] = [
  { id: '1', youtubeId: 'WXNJNci6hfo', title: '10 Point Ghosting Drill', subtitle: 'Coach Demo',   duration: '0:42', category: '10pt' },
  { id: '2', youtubeId: '7gtkwDIxO6A', title: '10 Point Ghosting Drill', subtitle: 'Visual Guide', duration: '0:37', category: '10pt' },
  { id: '3', youtubeId: 'j5CypiAZpoc', title: '6 Points Ghosting Drill', subtitle: 'Coach Demo',   duration: '0:22', category: '6pt'  },
  { id: '4', youtubeId: 'U52zeGOXJvw', title: '6 Point Ghosting Drill',  subtitle: 'Visual Guide', duration: '0:24', category: '6pt'  },
];

const CAT_COLOR: Record<string, string> = {
  '10pt': Colors.accentProgress,
  '6pt':  Colors.accentRoutines,
};

const thumbUrl = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

const SAFARI_UA = Platform.OS === 'ios'
  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  : 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const watchUrl = (id: string) => `https://m.youtube.com/watch?v=${id}`;

// ─── Article data ─────────────────────────────────────────────────────────────

const ARTICLES: ArticleItem[] = [
  {
    id: '1',
    tag: 'TECHNIQUE',
    tagColor: '#0A84FF',
    headerIcon: 'body-outline',
    readTime: '6 min',
    title: 'The Science of Squash Footwork',
    summary: 'How biomechanics research is reshaping how elite players approach court coverage and T-position recovery.',
    content: `Squash is fundamentally a movement sport. Elite players complete over 300 directional changes in a single five-game match, each demanding explosive force generation followed by immediate deceleration. Understanding the biomechanics behind these movements transforms ghosting from mindless running into purposeful athletic training.

The cornerstone of elite squash footwork is the split-step — a small two-footed hop performed just as the opponent contacts the ball. This movement simultaneously pre-loads the hip flexors, calves, and Achilles tendons, enabling the body to react in any direction within 150–200 milliseconds. Research shows that players who consistently perform a split-step gain up to 0.4 seconds per movement cycle — a decisive margin when rallies are decided by centimetres.

Every squash movement can be broken into three phases: initiation (split-step to first push-off), travel (covering court distance), and loading (lunging to play the shot). The loading phase carries the highest injury risk, particularly for the knee and ankle ligaments. Ghosting drills that isolate each phase develop technical precision that combined drills cannot.

Lunge mechanics deserve focused attention. The optimal squash lunge positions the lead knee directly over the ankle rather than beyond the toes. The torso stays upright to preserve full racket swing. Players with collapsed lunges develop compensatory movement patterns that progressively limit both shot range and recovery speed, often without noticing until performance plateaus.

T-position recovery is where elite footwork separates from good footwork. Studies of professional matches show top-50 players return to within half a metre of the T in under 1.2 seconds after striking the ball. This speed comes from driving off the lunge leg with hip extension — a crossover push-back step, not a jog. Ghosting drills that emphasise explosive recovery, not just reaching the position, build the posterior chain strength this requires.

Practical application: incorporate slow-motion lunge technique work into warm-ups, film your ghosting from above to review court coverage patterns, and add dedicated recovery-sprint sets where each repetition ends with a maximal push back to the T. Your feet are your racket — train them with as much precision as you bring to your swing.`,
  },
  {
    id: '2',
    tag: 'TRAINING',
    tagColor: '#FF6B35',
    headerIcon: 'timer-outline',
    readTime: '5 min',
    title: 'Building a 30-Day Ghosting Habit',
    summary: 'Consistency over intensity. A structured progressive plan for building a sustainable daily ghosting practice.',
    content: `The most common reason ghosting practice fails is not lack of intensity — it is inconsistency. Players train hard twice a week for three weeks, skip a session, lose momentum, and restart the same cycle. Building a ghosting habit requires a progressive structure designed to make the practice easier to continue than to stop.

Week one is about anchoring the habit, not building fitness. Keep sessions short — ten minutes maximum. Choose the same time each day. The goal is simple repetition: hit the court, go through the six or ten positions at easy tempo, return to the T. No pressure on speed or fatigue. The brain needs repetition to encode a habit loop, and introducing intensity too early creates avoidance.

Week two introduces duration. Extend sessions to fifteen minutes and add one challenging set per session — one minute at competitive tempo. This controlled discomfort signals adaptation without breaking the habit anchor. By the end of week two, most players notice the sessions feeling shorter than they are, which is the habit beginning to cement.

Weeks three and four layer in structure: defined sets and rest periods, tempo variation, and movement pattern randomisation. By this point, skipping a session creates a subtle discomfort — the physical and cognitive restlessness of a disrupted routine. That restlessness is the habit signal. Nurture it.

Progress markers to track across thirty days: time to first drop in form during a session (this increases as fitness improves), average movements per minute at working tempo, and recovery heart rate at the end of each rest period. These metrics reveal adaptation more accurately than total distance covered or perceived effort, which fluctuate with sleep, nutrition, and stress.

After thirty days, the habit no longer requires willpower — it requires absence to break. Schedule the next thirty days before day thirty ends. Ghosting compounds: each session builds on the last, and the cumulative effect on court coverage, endurance, and movement confidence is dramatic over a three-month horizon.`,
  },
  {
    id: '3',
    tag: 'TACTICS',
    tagColor: '#BF5AF2',
    headerIcon: 'analytics-outline',
    readTime: '7 min',
    title: 'Handedness and Court Coverage Asymmetry',
    summary: 'Data from 500 sessions reveals left-handed players consistently over-cover their backhand side. How to fix it.',
    content: `Data collected from over 500 ghosting sessions reveals a consistent and correctable pattern: left-handed players over-cover their backhand side by 23% relative to right-handed players covering the equivalent positions. Right-handed players show the inverse — a 17% bias toward the forehand side. Neither group is aware of it. Asymmetric court coverage is one of the most underaddressed tactical liabilities in club-level squash.

The cause is intuitive once identified. Players unconsciously bias their movement toward positions where they feel most confident. A right-hander comfortable with their forehand drive arrives slightly early to the forehand corners and slightly late to the backhand positions. Over hundreds of repetitions in ghosting and in match play, these micro-delays accumulate into detectable positional habits that opponents begin to exploit.

The detection method is straightforward: ghost your normal session while a training partner or phone camera records from directly above the court. Review the footage and mark the duration of each T-recovery. Positions where recovery is consistently fast are over-covered; positions where recovery is consistently slow are under-covered. The gap reveals your asymmetry.

Correction requires deliberate asymmetric practice — not balanced practice. If your backhand side is under-covered, design ghosting sets that weight backhand positions at 60–70% of total repetitions until your recovery times equalise. This feels unnatural initially, which confirms it is addressing a real bias rather than reinforcing an existing one.

An additional layer of asymmetry affects left-handed players specifically. Since most coaching resources and match strategy analyses are written for right-handed players, left-handers often import the wrong spatial mental model of the court. The positions where opponents will attack you are mirror-reversed from default tactical wisdom. Building your own shot-and-position response matrix — specific to your handedness — is one of the most high-value tactical exercises available.

Spend one month deliberately training your weak-side asymmetry. Court coverage equity is not about treating both sides equally — it is about moving from both sides with equal confidence and equal speed.`,
  },
  {
    id: '4',
    tag: 'FITNESS',
    tagColor: '#34C759',
    headerIcon: 'heart-outline',
    readTime: '4 min',
    title: 'Recovery Between Ghosting Sets',
    summary: 'The optimal rest-to-work ratio for different skill levels, backed by sports physiology research.',
    content: `The rest period in a ghosting session is not inactive time — it is where adaptation happens. During rest, the cardiovascular system removes lactate, phosphocreatine stores reload, and the central nervous system recovers its firing capacity. Training the right rest-to-work ratio is as important as training the work itself.

For beginner players, a work-to-rest ratio of 1:3 is appropriate — one minute of ghosting followed by three minutes of recovery. This ratio allows near-complete cardiovascular recovery between sets and maintains movement quality throughout the session. Training with too little rest when movement quality has degraded ingrains poor footwork patterns, which are harder to correct than they are to prevent.

Intermediate players benefit from 1:2 ratios — one minute of work, two minutes of rest. At this level, incomplete recovery between sets becomes a training stimulus in itself, developing the ability to execute technically correct movement under fatigue. This mirrors the demands of a three-game squash match where rallies follow each other with only brief recovery between points.

Advanced and competitive players work at 1:1 or even 2:1 to replicate five-game match demands. Critically, the rest period should involve active recovery — walking slowly around the court, controlled breathing, light shoulder and hip rotation — rather than complete stillness. Active recovery accelerates lactate clearance by 30–40% compared to passive rest.

Heart rate is the most objective guide to recovery completeness. For genuine set-to-set recovery, wait until your heart rate drops below 65% of your maximum before beginning the next set. For progressive fatigue training, begin the next set at 75–80%. Using a heart rate monitor during ghosting sessions removes guesswork and makes progression trackable across weeks.

Breathing pattern during rest matters more than most players realise. Box breathing — four seconds in, four seconds hold, four seconds out, four seconds hold — activates the parasympathetic nervous system and accelerates heart rate recovery measurably faster than shallow panting. Practise it during rest periods until it becomes automatic.`,
  },
  {
    id: '5',
    tag: 'CONDITIONING',
    tagColor: '#FF9F0A',
    headerIcon: 'barbell-outline',
    readTime: '4 min',
    title: 'Preparing Your Body for Five-Game Matches',
    summary: 'High-intensity ghosting prepares players for five-game matches by building repeated-sprint endurance across all energy systems.',
    content: `A five-game squash match at competitive club level can last 60–90 minutes of total elapsed time, with 25–40 minutes of actual play. The physiological demands combine aerobic base endurance with repeated maximal anaerobic sprints — a combination that few training modalities prepare for as effectively as structured ghosting.

Squash uses all three energy systems: the phosphocreatine system for explosive first-step acceleration (0–6 seconds), the glycolytic system for longer rallies (6–60 seconds), and the oxidative aerobic system for between-set recovery and sustaining effort across games. Five-game match readiness requires developing all three, and ghosting drills can be specifically designed to target each.

For phosphocreatine development, use very short ghosting bursts — 6-second maximum-effort sequences from the T — with full 30-second recovery between each. For glycolytic development, 30–45 second high-intensity sets with 60-second recovery periods replicate the demands of extended squash rallies. For aerobic base, long easy-tempo ghosting sessions at 60–70% maximum heart rate for 20–30 minutes build the recovery capacity that allows you to sustain performance across five games.

Off-court supplementary conditioning accelerates five-game readiness. Lateral band walks and single-leg Romanian deadlifts directly target the hip abductors and posterior chain muscles that ghosting stresses most. Calf-raise progressions reduce Achilles tendon injury risk. Box jumps and broad jumps develop explosive push-off power that translates directly to first-step quickness on court.

Periodisation across a training week matters for competitive players. Heavy ghosting sessions should not be scheduled within 36 hours of a match — residual fatigue reduces reactive agility even when players feel physically recovered. A standard week for a competing player: Monday heavy ghosting, Tuesday court skills, Wednesday rest, Thursday moderate ghosting plus match play, Friday rest, Saturday competition.

The five-game match is the hardest physical test recreational squash offers. Players who prepare specifically for its demands — rather than just playing more matches — show markedly better performance in the fourth and fifth games where physical preparation separates competitors.`,
  },
  {
    id: '6',
    tag: 'AGILITY',
    tagColor: '#FF453A',
    headerIcon: 'flash-outline',
    readTime: '4 min',
    title: 'Reactive Agility for Competitive Players',
    summary: 'Reactive agility training enhances a player\'s ability to move and respond quickly to unpredictable match situations.',
    content: `Most ghosting practice is planned agility training — you move to positions in a predetermined sequence or respond to cues you have largely anticipated. Match play demands something different: reactive agility, the ability to redirect explosive movement in response to stimuli you did not predict. The two capacities are related but distinct, and elite players train both.

Research on agility in racket sports distinguishes between anticipatory movement (reacting to opponent body language and swing cues before contact) and reactive movement (responding to ball direction after contact). Both improve with practice, but they require different training approaches. Ghosting develops movement mechanics; reactive agility training develops decision speed.

The simplest reactive ghosting method is random-position calling. Rather than following a fixed sequence, have a training partner call positions unpredictably — or use an app that generates truly random position sequences with variable intervals. The unpredictability forces genuine reactive initiation rather than predictive movement, which transfers more directly to match performance.

More advanced reactive agility training adds decision layers. Instead of moving to the called position, the player must identify whether the position is forehand or backhand and adjust grip before arriving. Or identify front, mid, or back zone and select a specific footwork pattern appropriate to each. These compound decisions replicate the multi-layer processing required during a rally.

Visual anticipation skill can be developed with video analysis. Reviewing match footage and pausing before the opponent contacts the ball to predict direction trains the perceptual scanning patterns that underpin early movement initiation. Players who have done 20–30 hours of structured video analysis show measurable improvement in reactive agility testing compared to those who have played equivalent match hours without analysis.

Reactive agility degrades faster under fatigue than planned agility. Training reactive movement in a fatigued state — final sets of a long ghosting session, or after a conditioning circuit — is specifically valuable for the latter stages of long matches when reaction time matters most.`,
  },
  {
    id: '7',
    tag: 'MENTAL',
    tagColor: '#30D1C8',
    headerIcon: 'bulb-outline',
    readTime: '4 min',
    title: 'How to Simulate Match Pressure When Training Alone',
    summary: 'Solo squash training can become a high-pressure match simulation by inserting consequences, scoring, and visualisation into ghosting.',
    content: `The gap between training performance and match performance is fundamentally a pressure management problem. In a session alone on court, you can execute ghosting drills with focus and control. In a competitive match, the same movements can feel unfamiliar, rushed, and error-prone. The solution is not to remove pressure from training — it is to deliberately insert it.

The most effective pressure simulation is consequence-based practice. Rather than completing a ghosting set and moving on, assign outcomes to performance thresholds. If you complete the set with fewer than two technical breakdowns, take thirty seconds of rest. If you break form twice or more, take ten seconds and immediately repeat the set. This creates a stakes-like environment where substandard execution has a cost, training the emotional regulation that competitive play demands.

Scoring systems transform ghosting into performance practice. Assign points for clean movements (full extension, correct footwork, strong recovery to T), deduct points for shortcuts (short-arming, slow recovery, missed positions), and set targets per set. A target of 18 points out of 20 possible creates pressure that running through positions without scoring does not. Review your scores across sessions — improvement in scored ghosting correlates directly with improvement under match pressure.

Visualisation of an opponent elevates session intensity without requiring a partner. Before each ghosting set, spend thirty seconds visualising a specific opponent — their typical drive depth, cross-court frequency, tendency to volley. Then ghost the session as if responding to that player's patterns. Functional MRI studies show that vivid athletic visualisation activates the same motor planning systems as physical execution.

Final-game simulation is specific pressure training for the competitive context most players find hardest. Set a ghosting session as a fifth-game tie-break scenario: you need five more points, every position counts. The physical demand is identical to a regular session, but the mental engagement changes entirely. Players who regularly train final-game scenarios report significantly reduced anxiety in actual competitive deciders.`,
  },
  {
    id: '8',
    tag: 'TACTICS',
    tagColor: '#BF5AF2',
    headerIcon: 'navigate-outline',
    readTime: '6 min',
    title: 'Mastering the T: Why Position Recovery Wins Matches',
    summary: 'PSA match analysis shows the player controlling the T wins over 72% of points. Here is how to train for it.',
    content: `Match analysis of PSA World Tour events consistently shows that the player who controls the T wins the point in over 72% of cases. The T is not simply a convenient central location — it is the tactical fulcrum of a squash match. Understanding why the T matters, and training recovery to it as a primary technical priority, changes how you think about every aspect of court movement.

The T's geometric advantage is straightforward: from the T-position, you are within three steps of every corner of the court. From any other position, at least two corners require four or more steps to reach. Each additional step costs approximately 0.15 seconds of arrival time. Cede the T for one exchange and your opponent has an extra third of a second to prepare — sufficient time to volley, change direction, or disguise their shot.

Poor T-recovery is most often not a fitness problem — it is a habit problem. Players who recover slowly to the T have typically learned to arrive at the ball position and immediately focus on shot selection, delaying push-back. Effective T-recovery requires the push-back decision to be made simultaneously with or before the shot execution, not after it. This requires pre-planning the recovery path as you approach the ball.

The two most common T-recovery errors are the directional pause and over-travel. The directional pause occurs when a player stops at the ball position before initiating recovery, losing 0.2–0.3 seconds. Over-travel occurs when the recovery overruns the T-position, requiring a correction step that destroys positioning advantage. Both errors are deeply ingrained in most club players and require specific correction drills.

Ghosting is uniquely effective for T-recovery training because it strips away the cognitive load of ball tracking, shot selection, and opponent reading. Without those demands, full attention can be directed to the push-back mechanics: the hip extension drive from the ball position, the crossover recovery step pattern, and the deceleration into the balanced split-step stance at the T. After thousands of correct repetitions in ghosting, these mechanics become automatic under the full cognitive load of match play.

Measure your T-recovery in practice sessions. Set a camera directly above the court and review footage. Within ten sessions of focused T-recovery work in ghosting, most players show measurable improvement in recovery consistency. Within thirty sessions, the correct mechanics are largely automatic. The T is where squash matches are won — train it with the same intent you give to your driving or volley technique.`,
  },
  {
    id: '9',
    tag: 'FITNESS',
    tagColor: '#34C759',
    headerIcon: 'pulse-outline',
    readTime: '5 min',
    title: 'Breathing Patterns That Improve Your Court Stamina',
    summary: 'Optimising your breathing rhythm during ghosting produces measurable improvements in endurance, recovery speed, and composure.',
    content: `Most squash players focus their conditioning efforts on legs, lungs, and heart rate. Few give deliberate attention to breathing mechanics, which is a significant oversight: breathing pattern is one of the few physiological variables that players can consciously control during play, and optimising it produces measurable improvements in endurance, recovery speed, and resistance to panic under pressure.

Diaphragmatic breathing — using the diaphragm rather than the chest — is the physiological baseline for efficient oxygen exchange. Chest breathing is shallower, activates the sympathetic nervous system, and delivers roughly 30% less oxygen per breath at equivalent effort levels. Most athletes default to chest breathing under high intensity, which compounds fatigue and elevates perceived exertion. Retraining diaphragmatic breathing under pressure is a conditioning intervention in its own right.

The squash-specific breathing rhythm that elite players naturally gravitate toward is a sharp exhale on every shot contact, followed by a quick inhale during the recovery step back to the T. This pattern serves three functions: it stabilises the core at contact, triggers a rapid inhale during the low-intensity recovery phase when oxygen uptake is most efficient, and creates a rhythmic pattern that prevents the breath-holding that many players default to during extended rallies.

Between-point recovery breathing should be active, not passive. After each rally ends, the optimal recovery sequence is: two sharp exhales to purge CO₂, followed by four slow nasal inhales, two short exhales, and a final slow nasal breath held briefly before the next rally begins. This sequence activates the parasympathetic system and reduces heart rate 8–12 beats per minute faster than unregulated recovery breathing.

During ghosting practice, add explicit breathing cues to your session design. Call a specific exhale at each simulated contact point. In the first week, the cues will feel disruptive to movement — within two weeks, they begin to integrate automatically. Players who complete four weeks of breath-cued ghosting consistently report feeling less panicked in extended rallies before fitness changes become measurable.

Breathing is the one performance variable directly shared between your physical and mental state. Regulate your breath and you regulate your physiological stress response. For a sport that requires both explosive physical output and calm tactical decision-making simultaneously, there may be no simpler high-yield intervention available.`,
  },
  {
    id: '10',
    tag: 'TACTICS',
    tagColor: '#BF5AF2',
    headerIcon: 'eye-outline',
    readTime: '6 min',
    title: 'How Elite Players Read the Game Before It Happens',
    summary: 'Anticipation and pattern recognition separate elite players. How to train the perceptual skills that produce early movement.',
    content: `The most remarkable quality of world-class squash players is how rarely they appear to be in a hurry. They arrive at the ball early, take time to set up their shot, and seem to know where their opponent is moving before it happens. This is not exceptional athleticism — it is exceptional perception. And perception, unlike natural speed, is a trainable skill.

Anticipation in squash operates through a hierarchy of cues. First-order cues are early body language indicators: opponent shoulder position before they begin their swing, weight distribution in the final step to the ball, and hip orientation at impact. Second-order cues come from court position analysis: what are the high-percentage shots from this position given the score, the match pattern, and the player's observed tendencies? Third-order cues emerge from pre-match scouting and pattern memory — what has this opponent done in this situation before?

Top players process all three cue levels before ball contact. The result is that they initiate movement on average 0.3–0.5 seconds earlier than club players facing identical situations. Over a five-game match, this advantage compounds into a decisive difference in court coverage and shot preparation time. Players who appear to be reading the game are — they have simply trained their perceptual hierarchy to operate faster and more accurately.

Video analysis is the highest-yield method for developing anticipation. Review footage of your own matches and pause at the moment your opponent begins their backswing. Before watching what happens, predict the shot. Check your prediction. Over 50–100 repetitions of this exercise with genuine commitment to the prediction, your first-order cue recognition improves measurably. Elite coaches use versions of this exercise as the primary off-court developmental tool for players at academy level.

Ghosting contributes to anticipation development more than players initially expect. The primary mechanism is spatial pattern memory: thousands of repetitions of correct court coverage build an unconscious spatial model of which positions follow which, what the highest-probability movement is from each court location, and how body position and momentum affect shot options. In match play, this spatial model generates movement initiations that feel intuitive but are actually learned pattern recognition.

The gap between club and elite squash is often misattributed to physical capability. The largest gap is perceptual — in how much of the available information is collected, processed, and acted on before the ball arrives. Train your perception with the same discipline you apply to your movement. The player who sees more, wins more.`,
  },
  {
    id: '11',
    tag: 'GHOSTING',
    tagColor: '#FF6B35',
    headerIcon: 'walk-outline',
    readTime: '5 min',
    title: 'Why Ghosting Is the Most Complete Solo Training Method',
    summary: 'No other solo drill develops fitness, footwork, pattern recognition, and mental focus simultaneously. Here is why ghosting stands alone.',
    content: `Ghosting is unique among solo training methods because every repetition is technically correct by design. When you hit a ball, the ball dictates what happens next — a short return pulls you forward, a wide ball forces an improvised recovery. In ghosting, every movement follows the ideal pattern: full extension, correct footwork, explosive T-recovery. You are not training around the ball; you are training the movement itself.

This matters enormously for skill development. Motor learning research consistently shows that high-repetition practice of correct patterns builds neural pathways faster and more durably than mixed-quality practice. A player who ghosts 200 movements in a session with good form builds stronger motor memory than one who hits 200 balls with varying footwork. The ghost player is always practising the right thing.

Ghosting simultaneously develops four athletic qualities that most training methods address separately: cardiovascular endurance (sustained high-intensity work), speed-endurance (repeated short sprints), agility (multidirectional acceleration and deceleration), and proprioception (body awareness in space under fatigue). A running programme builds cardio but not agility. Ladders build footwork but not endurance. Ghosting builds all four in the exact movement patterns squash requires.

The mental dimension of ghosting is underrated. Sustaining focused, high-quality movement for 30–45 minutes with no opponent, no ball, and no external motivation requires and builds the concentration discipline that separates players who execute well under pressure from those who lose focus in the fourth game. Solo training is harder to stay present for than match play — which is precisely why it trains the quality that match play does not.

SquashGhostingX is built around this principle: structure the ghost session so that every repetition reinforces the movement skill, the fitness base, and the mental discipline simultaneously. The app's position calling, tempo control, and voice coaching are designed to remove the cognitive overhead of session design, so every second on court is spent training — not planning.`,
  },
  {
    id: '12',
    tag: 'MOVEMENT',
    tagColor: '#5856D6',
    headerIcon: 'compass-outline',
    readTime: '5 min',
    title: 'Movement Economy: Do More with Less Energy on Court',
    summary: 'Elite players use 15–20% less energy for the same court coverage. Movement economy is trainable — and ghosting is the primary tool.',
    content: `Movement economy is a concept borrowed from distance running — the energy cost per unit of work performed. In squash, it translates to how much energy a player expends to cover the same court distance. Elite players at equivalent fitness levels use 15–20% less metabolic energy per movement than club players covering identical positions. That difference is entirely attributable to technique, not physiology.

The primary driver of poor movement economy is excess motion — steps that do not contribute to arriving at the ball faster. Common examples include: taking one extra step before the lunge, turning the body too far out of the recovery line, decelerating too early before the ball position, and over-rotating the trunk during recovery. Each small inefficiency costs energy. Accumulated across 300 directional changes in a match, the total cost is substantial.

Stride efficiency is the second major factor. Economical squash movement uses a crossover-and-lunge pattern rather than a stutter-step approach. The crossover step — one large lateral step before the final lunge — covers more ground per energy unit than two shorter stutter steps. Players who default to stutter steps under pressure, typically from a learned defensive habit, work harder to reach the same position. Ghosting at slow tempo with deliberate attention to stride pattern corrects this more effectively than match play, where time pressure forces compromises.

Centre of gravity management is the third lever. Players who run upright between positions then drop their centre of gravity at the ball position lose energy in the height change. Maintaining a consistent, slightly lowered athletic stance throughout the movement — as if staying ready — reduces the energy cost of that vertical transition for every single position change over a match.

Four weeks of deliberate economy-focused ghosting — slow tempo, emphasis on stride quality over speed — produces measurable reductions in heart rate at equivalent work rates. This is not fitness improving; it is mechanics improving. When your body moves efficiently, the same cardiovascular system delivers more output. Movement economy training is, in effect, free fitness.`,
  },
  {
    id: '13',
    tag: 'AGILITY',
    tagColor: '#FF453A',
    headerIcon: 'flash-outline',
    readTime: '4 min',
    title: 'Change of Direction Speed: Train the Quality That Wins Points',
    summary: 'Change of direction speed improves 30–40% faster than linear speed with targeted training. Here is how to develop it specifically for squash.',
    content: `Linear speed — straight-line sprinting — is largely determined by genetic factors like muscle fibre composition and limb proportions. It improves slowly with training and plateaus relatively quickly. Change of direction speed, by contrast, is highly trainable and improves 30–40% faster with targeted practice. For squash, a sport that involves almost no straight-line running, this is significant: the athletic quality that determines court performance is also the one most responsive to training.

Change of direction speed consists of three components: deceleration (slowing from one direction), weight transfer (loading the push-off leg), and re-acceleration (exploding in the new direction). Most players focus on the re-acceleration phase — the explosive push — and neglect deceleration mechanics. But deceleration determines how quickly weight can be transferred to the push-off leg, which sets the ceiling for re-acceleration. Training controlled, rapid deceleration before the change improves total change-of-direction speed even when push-off power stays constant.

The key muscle groups for squash change of direction are the hip abductors (gluteus medius and minimus), which stabilise the pelvis during lateral loading, and the posterior chain (glutes, hamstrings), which drive the push-off. Players with weak hip abductors show a characteristic valgus collapse of the knee on the loading side — the knee drops inward under load — which dissipates force and slows the change. Single-leg strengthening exercises targeting hip abductor stability eliminate this leak.

In ghosting, change of direction quality can be specifically trained by extending the deceleration phase deliberately. Rather than rushing to reach each position and immediately rebounding, practise arriving fully — weight loaded, stance stable, balance confirmed — before initiating recovery. This slows the session initially but builds the neuromuscular pattern for efficient direction change. As the pattern becomes automatic, speed returns, but now with correct mechanics rather than compensated rushing.

Track your change of direction improvement by timing your six-position ghosting circuit at maximum effort. Most players who complete four weeks of deliberate direction-change training show a 0.3–0.5 second improvement per full circuit — modest in absolute terms, but decisive across hundreds of direction changes in a competitive match.`,
  },
  {
    id: '14',
    tag: 'NUTRITION',
    tagColor: '#25C0A0',
    headerIcon: 'nutrition-outline',
    readTime: '5 min',
    title: 'The Squash Player\'s Nutrition Blueprint',
    summary: 'What to eat before, during, and after ghosting sessions. Fuelling strategy for club players who train 3–5 times per week.',
    content: `Squash is a high-intensity intermittent sport. Its nutrition demands differ from endurance sports (sustained moderate intensity) and strength sports (low-rep maximal effort). Understanding where squash sits on the energy system spectrum — predominantly glycolytic, with aerobic recovery between points — shapes a practical nutrition strategy for club players.

Pre-session fuelling: eat a mixed carbohydrate and protein meal 2–3 hours before a ghosting session. Aim for 1–1.5g of carbohydrate per kilogram of bodyweight (roughly 70–100g for most adults) and 20–30g of protein. This fills glycogen stores and provides amino acids for muscle protection during training. Avoid high-fat or high-fibre meals within two hours — both slow gastric emptying and can cause discomfort during high-intensity movement. A baked potato with cottage cheese, pasta with chicken, or rice with eggs all work well.

Post-session recovery: the 30–60 minutes following a ghosting session is the most important window for recovery nutrition. Muscle glycogen resynthesis peaks in this period, and protein synthesis rates are elevated. A 3:1 ratio of carbohydrate to protein — roughly 60g carbs and 20g protein — consumed within this window accelerates recovery measurably compared to delayed eating. Chocolate milk, Greek yoghurt with banana and honey, or a recovery shake are all effective.

Hydration is the most underaddressed nutrition variable in squash. Sweat rates during competitive squash range from 1 to 2 litres per hour, and many club players arrive at sessions already mildly dehydrated from daily life. A 2% reduction in body water — about 1.4kg for a 70kg player — produces a measurable decline in reaction time, decision-making accuracy, and perceived effort. Drink 500ml of water in the two hours before training and aim to replace most sweat losses during the session.

Anti-inflammatory nutrition supports recovery for players training three or more times per week. Omega-3 fatty acids (oily fish, flaxseed, walnuts), colourful vegetables, and tart cherry juice (supported by multiple randomised trials for muscle soreness reduction) reduce systemic inflammation from repeated high-intensity training. These are not supplements in the performance-drug sense — they are foods that accelerate the natural recovery process. Build them into regular meals rather than treating them as special additions.`,
  },
  {
    id: '15',
    tag: 'APP',
    tagColor: '#007AFF',
    headerIcon: 'phone-portrait-outline',
    readTime: '4 min',
    title: 'How SquashGhostingX Adapts to Your Skill Level',
    summary: 'From beginner to pro: how the app\'s drill configuration, tempo system, and voice coaching scale with your ability and goals.',
    content: `SquashGhostingX is built on a single design principle: every session should feel appropriately challenging regardless of where you are in your development. A beginner who is overwhelmed trains poorly; an advanced player who is under-challenged improves slowly. The app's configuration system is designed to keep every user in the productive zone between these two extremes.

The skill level setting — Beginner through to Pro — controls more than just pace. It adjusts movement interval timing, rest period defaults, position sequence complexity, and the threshold at which the app considers a set complete. A Beginner session uses longer intervals between position calls, more predictable sequences, and generous rest ratios. A Pro session uses shorter intervals, random sequences with minimal pattern repetition, and rest periods that replicate competitive match demands. The same 15-minute session feels completely different at each end of the scale.

Tempo is the most direct intensity control. Slow tempo is appropriate for technique-focused practice — learning the correct footwork pattern, working on lunge mechanics, or recovering from a break in training. Natural tempo mirrors actual match movement speed and is the default for most training sessions. Explosive tempo pushes beyond match speed, training the fast-twitch response required for anticipated shots and defensive retrievals. Switching tempo within a session — two sets slow, two sets explosive — is one of the most effective progressive training structures available.

Voice coaching provides the real-time feedback layer that solo training otherwise lacks. The call timing is calibrated to each tempo setting so the voice arrives when the player should be initiating movement, not after they have already decided where to go. At lower difficulty levels, this provides a clear target to move toward. At higher levels, the timing challenge trains both physical and cognitive speed simultaneously.

The drill type system — movement, shot-based, match simulation — adds a tactical intelligence layer that pure physical ghosting lacks. Shot-based drills call positions alongside shot types, training the player to mentally prepare the shot during movement rather than after arrival. Match simulation generates position sequences based on realistic squash rally patterns, so the training load reflects actual competitive demands rather than arbitrary sequences.`,
  },
  {
    id: '16',
    tag: 'FITNESS',
    tagColor: '#34C759',
    headerIcon: 'body-outline',
    readTime: '4 min',
    title: 'Core Strength: The Hidden Foundation of Court Movement',
    summary: 'Every lunge, recovery step, and shot you play is powered from your core. Here is how to train the muscles that squash actually demands.',
    content: `Core strength in squash is not about aesthetics or generic fitness — it is the specific ability to stabilise the spine under load while producing explosive limb movement simultaneously. Every squash lunge requires the core to brace the spine as the lead leg absorbs impact forces of 3–4 times bodyweight. Every shot requires the core to transfer power from the lower body through the trunk to the racket arm. A weak core bleeds force at these transfer points, reducing both shot power and movement speed.

The most squash-relevant core muscles are not the superficial abdominals — the visible six-pack — but the deep stabilisers: the transverse abdominis, which wraps around the trunk like a corset and braces the spine under load; the obliques, which drive rotational power in swings and body turns; and the multifidus, the deep spinal extensors that maintain lumbar stability under fatigue. These muscles are undertrained by most conventional core routines, which focus on flexion (crunches, sit-ups) rather than stabilisation (anti-rotation, anti-extension).

Ghosting itself trains functional core stability to a significant degree — every direction change requires a split-second stabilisation of the trunk before the push-off, and every lunge loads the core bracing system. This is one of ghosting's underappreciated training effects: players who ghost consistently develop measurably better dynamic balance than those who focus purely on running and hitting.

To supplement ghosting with targeted core training, prioritise three movement patterns: anti-extension (plank holds and rollouts, which resist the spine bending backward under load), anti-rotation (Pallof press and band-resisted rotations, which resist unwanted spinal rotation), and single-leg stability (single-leg Romanian deadlifts, which mirror the lunge loading pattern). Twenty minutes of these exercises three times per week produces noticeable improvements in court stability within six weeks.

The most important signal of adequate core strength for squash is whether you can maintain upright posture through the final repetitions of a hard ghosting set. Players whose torso drops forward and whose shots get shorter and higher as fatigue sets in are showing a core endurance deficit, not just a cardiovascular one. Training core endurance specifically — longer hold times, more repetitions — addresses this directly.`,
  },
  {
    id: '17',
    tag: 'TRAINING',
    tagColor: '#FF6B35',
    headerIcon: 'trending-up-outline',
    readTime: '5 min',
    title: 'Progressive Overload: The Law That Makes Ghosting Actually Work',
    summary: 'Without progressive overload, ghosting becomes maintenance. Here is how to apply sport science\'s most important principle to your sessions.',
    content: `Progressive overload is the foundational principle of all effective physical training: the body adapts to the demands placed on it, and to continue adapting, those demands must systematically increase. Without progression, training produces a plateau — not failure, but stagnation. The same ghosting session performed at the same intensity indefinitely will maintain your current fitness level. It will not improve it.

For ghosting training, progressive overload can be applied across four variables: volume (total number of movements per session), intensity (tempo and effort level), density (work-to-rest ratio — more work in the same time), and complexity (position sequence variety, shot-type integration, or random calling). Each variable produces a different adaptation. Increasing volume builds aerobic base and movement endurance. Increasing intensity builds speed-endurance and fast-twitch development. Increasing density builds match-specific fitness. Increasing complexity builds decision speed and pattern recognition.

The safest and most effective progression protocol is to increase one variable at a time across a two-to-four-week block. Example: spend three weeks increasing session volume (add 10% more movements per session each week), then hold volume constant for one week while increasing tempo for two weeks. This isolates adaptation stress to one system at a time and allows accurate assessment of which changes are producing improvement.

Deload weeks — planned reductions in training load — are a non-negotiable part of progressive training. Every third or fourth week, reduce volume and intensity by 40–50%. This is not rest; it is the week when the adaptations from the previous weeks consolidate. Players who skip deloads eventually plateau or get injured, not because they trained too much, but because they never allowed adaptation to complete. Feeling slightly under-trained during a deload week is correct and productive.

Signs that progression is working: your perceived effort at a previously hard tempo decreases, your T-recovery time shortens at equivalent intensities, and your form holds up for more of the session before degrading. Signs that progression is too aggressive: sleep quality drops, resting heart rate elevates by more than five beats per minute over baseline, motivation declines, and minor aches become persistent. The goal is to accumulate training stress systematically, not maximally.`,
  },
  {
    id: '18',
    tag: 'FITNESS',
    tagColor: '#34C759',
    headerIcon: 'moon-outline',
    readTime: '4 min',
    title: 'Sleep: The Performance Variable You Are Probably Ignoring',
    summary: 'Six hours versus eight hours of sleep produces a 20% decline in reaction time. For a sport decided by milliseconds, sleep is training.',
    content: `Athletes who sleep less than seven hours per night show a 20% reduction in reaction time compared to those sleeping eight or more hours. In squash, where split-second movement initiation is decisive, this is not a small difference — it is the equivalent of removing a full training block of speed development overnight. Sleep is not recovery from training; sleep is training.

During slow-wave sleep (the deep stages of the sleep cycle), the body releases the majority of its daily growth hormone pulse, which drives muscle protein synthesis and connective tissue repair. A ghosting session tears down muscle fibres; sleep is when they rebuild stronger. Players who consistently undersleep accumulate micro-damage faster than they can repair it, producing a slow decline in power output and increasing injury risk — often attributed to overtraining when the real cause is under-recovery.

Motor learning — the process by which new movement patterns are consolidated into reliable automatic skill — is critically dependent on sleep. Studies using motor sequence learning tasks show that skill consolidation happens during the sleep that follows practice, not during practice itself. The ghosting session plants the pattern; sleep cements it. Sacrificing sleep the night after a hard session wastes much of the training stimulus from that session.

Practical sleep strategies for squash training: avoid screens for 60 minutes before bed (blue light suppresses melatonin and delays sleep onset by 30–60 minutes); keep your sleep environment cool (the body's core temperature must drop to initiate sleep, and a cool room accelerates this); maintain a consistent sleep and wake time, including weekends (consistency calibrates the circadian rhythm so sleep is deeper and more restorative); and if training in the evening, eat the post-session recovery meal at least 90 minutes before your intended sleep time (the thermic effect of food raises core temperature, delaying sleep quality).

If your training load has increased and your performance has plateaued despite consistent sessions, before adding more training, audit your sleep. Eight hours of quality sleep combined with a moderate training load outperforms nine hours of training with six hours of sleep. The dose of training is less important than the dose of recovery.`,
  },
  {
    id: '19',
    tag: 'CONDITIONING',
    tagColor: '#FF9F0A',
    headerIcon: 'fitness-outline',
    readTime: '4 min',
    title: 'The Right Way to Warm Up and Cool Down for Ghosting',
    summary: 'A 10-minute dynamic warm-up reduces injury risk by 35% and improves first-set performance. Most players skip it. Here is the routine.',
    content: `A dynamic warm-up before ghosting does two things that static stretching cannot: it raises core body temperature (increasing muscle elasticity and reducing injury risk) and primes the neuromuscular system for explosive movement (improving first-set quality). Cold muscles are less elastic, less powerful, and more injury-prone. The first five minutes of a ghosting session performed without warm-up are both less effective and meaningfully more risky than the same five minutes following a proper dynamic routine.

The optimal pre-ghosting warm-up takes 8–12 minutes and follows a proximal-to-distal pattern — start at the centre of the body and move outward to the extremities. Begin with 2 minutes of light jogging or skipping to raise core temperature. Progress to hip circles, lateral lunges, and rotational thoracic stretches to mobilise the joints that ghosting loads most heavily. Add dynamic leg swings (forward and lateral) to activate the hip flexors and abductors. Finish with 10–15 explosive split-steps to prime the stretch-shortening cycle before the first working set.

The warm-up is also the right time to perform any technique cues you plan to focus on during the session. If you are working on lunge mechanics, perform five slow-motion lunges per side during the warm-up, establishing the correct knee-over-ankle position before adding speed. This primes the motor pattern before fatigue complicates execution.

Cool-down is equally neglected and equally important. Five minutes of slow walking around the court lowers heart rate gradually, preventing blood pooling in the lower limbs. Follow with static stretching of the hip flexors (lunge stretch, 30 seconds per side), hamstrings (seated or standing, 30 seconds), calves (wall stretch, 30 seconds), and the thoracic rotators (seated rotation, 30 seconds per side). Perform static stretching only after exercise, never before — cold static stretching reduces power output for up to an hour and provides no injury protection benefit.

Include a 2-minute breathing reset at the end of the cool-down: seated, eyes closed, box breathing pattern (four counts in, four counts hold, four counts out, four counts hold) for five cycles. This actively shifts the nervous system from sympathetic (high alert) to parasympathetic (recovery), accelerating the hormonal recovery process and improving sleep quality if the session was in the evening.`,
  },
  {
    id: '20',
    tag: 'APP',
    tagColor: '#007AFF',
    headerIcon: 'stats-chart-outline',
    readTime: '5 min',
    title: 'Reading Your Session Data to Train Smarter',
    summary: 'SquashGhostingX tracks more than just time. Here is how to read zone distribution, intensity scores, and completion data to guide your training.',
    content: `Most squash players train by feel — sessions are hard when they feel hard, and progress is measured by subjective sense of improvement. SquashGhostingX replaces this with objective data: every session generates movement counts, zone distribution percentages, intensity scores, and completion rates that reveal patterns invisible to subjective assessment. Learning to read this data is the difference between training consistently and training intelligently.

Zone distribution — the percentage of movements in front, mid, and back court — is one of the most revealing metrics. Most players assume they cover the court evenly. The data almost always shows otherwise. A back-heavy distribution (more than 45% of movements in the back zone) typically indicates a defensive court pattern — the player is comfortable in the back but initiates less movement to the front. A front-heavy distribution often indicates aggressive net play habits but reduced fitness for extended back-court retrievals. Compare your distribution across sessions to identify whether your patterns shift with fatigue — most players show a progressive retreat to mid and back court as sessions progress.

The intensity score combines movement volume, tempo, and completion rate into a single comparable number across sessions. The most useful way to read intensity scores is longitudinally: plot the last ten sessions and look for trend direction. A rising trend at equivalent tempo settings means fitness is improving. A flat trend after four weeks means progression is needed — increase volume or tempo. A falling trend is an early warning sign of accumulated fatigue, overtraining, or insufficient recovery.

Completion rate — the percentage of planned movements completed before form breaks down — is the most honest measure of where your current training load sits relative to your capacity. A completion rate consistently above 95% means the session is not challenging enough. A completion rate below 70% means volume or tempo needs to be reduced. The productive training zone is 75–90% completion — enough challenge to drive adaptation, not so much that form degrades and poor movement patterns are reinforced.

Personal bests track peak performance across specific drill types and metrics. Review them monthly rather than weekly — single-session peaks are noisy and often influenced by factors like time of day, hydration, or motivation. Monthly trends reveal true physiological adaptation. When a personal best in movements-per-session has stood for more than six weeks, it is a signal to change one training variable. Plateauing personal bests are not failures — they are information.`,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const route = useRoute<RouteProp<{ Library: { articleId?: string } }, 'Library'>>();
  const [modalVideo,      setModalVideo]      = useState<VideoItem | null>(null);
  const [readingArticle,  setReadingArticle]  = useState<ArticleItem | null>(null);
  // BUG-023: track navigation history so ← goes back through prev/next chain.
  const [articleHistory,  setArticleHistory]  = useState<ArticleItem[]>([]);
  const [failedThumbs,    setFailedThumbs]    = useState<Set<string>>(new Set());
  const articleScrollRef = useRef<ScrollView>(null);

  // Open a specific article when navigated from HomeScreen Training Tips
  useEffect(() => {
    const articleId = route.params?.articleId;
    if (!articleId) return;
    const target = ARTICLES.find((a) => a.id === articleId);
    if (target) {
      setReadingArticle(target);
      setArticleHistory([]);
      setTimeout(() => articleScrollRef.current?.scrollTo({ y: 0, animated: false }), 30);
    }
  }, [route.params?.articleId]);

  const articleIdx  = readingArticle ? ARTICLES.findIndex(a => a.id === readingArticle.id) : -1;
  const prevArticle = articleIdx > 0 ? ARTICLES[articleIdx - 1] : null;
  const nextArticle = articleIdx < ARTICLES.length - 1 ? ARTICLES[articleIdx + 1] : null;

  function openArticle(a: ArticleItem) {
    if (readingArticle) {
      setArticleHistory(prev => [...prev, readingArticle]);
    }
    setReadingArticle(a);
    setTimeout(() => articleScrollRef.current?.scrollTo({ y: 0, animated: false }), 30);
  }

  // BUG-023: ← goes back in reading history; if history is empty, closes the modal.
  function goBackArticle() {
    if (articleHistory.length > 0) {
      const last = articleHistory[articleHistory.length - 1];
      setArticleHistory(prev => prev.slice(0, -1));
      setReadingArticle(last);
      setTimeout(() => articleScrollRef.current?.scrollTo({ y: 0, animated: false }), 30);
    } else {
      setReadingArticle(null);
      setArticleHistory([]);
    }
  }

  function closeArticleReader() {
    setReadingArticle(null);
    setArticleHistory([]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── VIDEO PLAYER MODAL ──────────────────────────────────── */}
      <Modal
        visible={modalVideo !== null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalVideo(null)}
      >
        <SafeAreaProvider>
          <View style={styles.vmContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#111' }}>
              <View style={styles.vmHeader}>
                <View style={styles.vmTitleRow}>
                  <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                  <Text style={styles.vmTitle} numberOfLines={1}>{modalVideo?.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVideo(null)}
                  style={styles.vmClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.vmCloseLabel}>Close</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
            {modalVideo && (
              <WebView
                source={{ uri: watchUrl(modalVideo.youtubeId) }}
                style={styles.vmWebView}
                userAgent={SAFARI_UA}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                sharedCookiesEnabled={Platform.OS === 'ios'}
                startInLoadingState
                onShouldStartLoadWithRequest={(req) => {
                  const u = req.url;
                  if (u.startsWith('youtube://') || u.startsWith('vnd.youtube') || u.startsWith('intent://')) {
                    return false;
                  }
                  return true;
                }}
                renderLoading={() => (
                  <View style={styles.vmLoading}>
                    <Ionicons name="logo-youtube" size={48} color="#FF0000" />
                    <Text style={styles.vmLoadingText}>Loading…</Text>
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaProvider>
      </Modal>

      {/* ── ARTICLE READER MODAL ────────────────────────────────── */}
      <Modal
        visible={readingArticle !== null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={goBackArticle}
      >
        <SafeAreaProvider>
          <View style={styles.amContainer}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" />

          {/* Scrollable content — starts from very top (behind floating header) */}
          <ScrollView
            key={readingArticle?.id}
            ref={articleScrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Colour banner — tall enough to show below floating header */}
            {readingArticle && (
              <View style={[styles.amBanner, { backgroundColor: readingArticle.tagColor }]}>
                <View style={styles.amBannerCircle1} />
                <View style={styles.amBannerCircle2} />
                <Ionicons name={readingArticle.headerIcon as any} size={80} color="rgba(255,255,255,0.88)" />
                {/* Article position indicator */}
                <View style={styles.amBannerCounter}>
                  <Text style={styles.amBannerCounterText}>
                    {articleIdx + 1} / {ARTICLES.length}
                  </Text>
                </View>
              </View>
            )}

            {/* Article body */}
            <View style={styles.amBody}>
              <View style={styles.amMetaRow}>
                <View style={[styles.amTagPill, { backgroundColor: `${readingArticle?.tagColor ?? '#888'}22` }]}>
                  <Text style={[styles.amTagText, { color: readingArticle?.tagColor }]}>{readingArticle?.tag}</Text>
                </View>
                <Text style={styles.amReadTime}>{readingArticle?.readTime} read</Text>
              </View>
              <Text style={styles.amTitle}>{readingArticle?.title}</Text>
              <Text style={styles.amByline}>SquashGhostingX Editorial</Text>
              <View style={styles.amDivider} />
              {readingArticle?.content.split('\n\n').map((para, i) => (
                <Text key={i} style={styles.amPara}>{para}</Text>
              ))}

              {/* ── PREV / NEXT NAVIGATION ── */}
              <View style={styles.amNavDivider} />
              <Text style={styles.amNavHeading}>More Articles</Text>
              <View style={styles.amNavCards}>
                {prevArticle ? (
                  <TouchableOpacity
                    style={styles.amNavCard}
                    onPress={() => openArticle(prevArticle)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.amNavCardHeader}>
                      <Ionicons name="arrow-back" size={13} color={prevArticle.tagColor} />
                      <Text style={[styles.amNavDir, { color: prevArticle.tagColor }]}>Previous</Text>
                    </View>
                    <Text style={styles.amNavCardTitle} numberOfLines={2}>{prevArticle.title}</Text>
                    <View style={[styles.amNavCardAccent, { backgroundColor: prevArticle.tagColor }]} />
                  </TouchableOpacity>
                ) : <View style={styles.amNavCardBlank} />}

                {nextArticle ? (
                  <TouchableOpacity
                    style={[styles.amNavCard, { alignItems: 'flex-end' }]}
                    onPress={() => openArticle(nextArticle)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.amNavCardHeader}>
                      <Text style={[styles.amNavDir, { color: nextArticle.tagColor }]}>Next</Text>
                      <Ionicons name="arrow-forward" size={13} color={nextArticle.tagColor} />
                    </View>
                    <Text style={[styles.amNavCardTitle, { textAlign: 'right' }]} numberOfLines={2}>{nextArticle.title}</Text>
                    <View style={[styles.amNavCardAccent, { backgroundColor: nextArticle.tagColor }]} />
                  </TouchableOpacity>
                ) : <View style={styles.amNavCardBlank} />}
              </View>

              <View style={{ height: 64 }} />
            </View>
          </ScrollView>

          {/* Floating nav row — SafeAreaView handles correct top inset inside modal */}
          <SafeAreaView
            edges={['top']}
            style={styles.amFloatBar}
            pointerEvents="box-none"
          >
            {/* BUG-023: ← navigates back through reading history; × always closes */}
            <TouchableOpacity
              style={styles.amFloatBtn}
              onPress={goBackArticle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name={articleHistory.length > 0 ? 'arrow-back' : 'arrow-back'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.amFloatBtn}
              onPress={closeArticleReader}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </Modal>

      {/* ── MAIN SCROLL ─────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Library</Text>
          <Text style={styles.heroSub}>Coaching videos and articles to sharpen your squash IQ.</Text>
        </View>

        {/* ── WATCH & LEARN ──────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLeft}>
            <Ionicons name="play-circle" size={18} color={Colors.accentProgress} />
            <Text style={styles.sectionTitle}>Watch & Learn</Text>
          </View>
          <Text style={styles.sectionCount}>{VIDEOS.length} videos</Text>
        </View>

        <View style={styles.videoGrid}>
          {VIDEOS.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.videoCard}
              onPress={() => setModalVideo(v)}
              activeOpacity={0.85}
            >
              <View style={styles.vcThumbWrap}>
                {failedThumbs.has(v.youtubeId) ? (
                  <View style={[styles.vcThumb, styles.vcThumbFallback]}>
                    <Ionicons name="logo-youtube" size={28} color="rgba(255,255,255,0.3)" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: thumbUrl(v.youtubeId) }}
                    style={styles.vcThumb}
                    resizeMode="cover"
                    onError={() => setFailedThumbs(prev => new Set([...prev, v.youtubeId]))}
                  />
                )}
                <View style={styles.vcOverlay} />
                {/* Play button centred */}
                <View style={styles.vcPlayCircle}>
                  <View style={styles.vcPlayCircleInner}>
                    <Ionicons name="play" size={18} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.vcDurationBadge}>
                  <Text style={styles.vcDurationText}>{v.duration}</Text>
                </View>
                <View style={[styles.vcCatBadge, { backgroundColor: CAT_COLOR[v.category] }]}>
                  <Text style={styles.vcCatBadgeText}>{v.category === '10pt' ? '10 PT' : '6 PT'}</Text>
                </View>
              </View>
              <Text style={styles.vcTitle} numberOfLines={2}>{v.title}</Text>
              <Text style={styles.vcSubtitle}>{v.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TRAINING TIPS ──────────────────────────────────────── */}
        <View style={[styles.sectionRow, { marginTop: Spacing.lg }]}>
          <View style={styles.sectionLeft}>
            <Ionicons name="book-outline" size={18} color={Colors.accentLibrary} />
            <Text style={styles.sectionTitle}>Training Tips</Text>
          </View>
          <Text style={styles.sectionCount}>{ARTICLES.length} articles</Text>
        </View>

        {ARTICLES.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={styles.articleCard}
            onPress={() => openArticle(a)}
            activeOpacity={0.8}
          >
            <View style={[styles.acAccent, { backgroundColor: a.tagColor }]} />
            <View style={styles.acBody}>
              <View style={styles.acTopRow}>
                <View style={[styles.acTagPill, { backgroundColor: `${a.tagColor}22` }]}>
                  <Text style={[styles.acTagText, { color: a.tagColor }]}>{a.tag}</Text>
                </View>
                <View style={styles.acTopRight}>
                  <Text style={styles.acReadTime}>{a.readTime} read</Text>
                  <View style={[styles.acIconBadge, { backgroundColor: `${a.tagColor}18` }]}>
                    <Ionicons name={a.headerIcon as any} size={13} color={a.tagColor} />
                  </View>
                </View>
              </View>
              <Text style={styles.acTitle}>{a.title}</Text>
              <Text style={styles.acSummary} numberOfLines={3}>{a.summary}</Text>
              <View style={styles.acFooter}>
                <Text style={[styles.acReadMore, { color: a.tagColor }]}>Read article</Text>
                <Ionicons name="arrow-forward" size={13} color={a.tagColor} />
              </View>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  // Hero
  hero: {
    backgroundColor: Colors.heroLibrary,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: Spacing.lg,
  },
  heroTitle: { fontSize: 34, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  heroSub:   { fontSize: FontSize.label, color: 'rgba(255,255,255,0.55)' },

  // Section rows
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionCount: { fontSize: FontSize.caption, color: Colors.textMuted },

  // ── Video 2×2 grid ──────────────────────────────────────────────────────────
  videoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.base, gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  videoCard: { width: VG_CARD_W },

  vcThumbWrap: {
    width: VG_CARD_W, height: VG_THUMB_H,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated, marginBottom: 6,
  },
  vcThumb:           { width: '100%', height: '100%' },
  vcThumbFallback:   { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  vcOverlay:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  vcPlayCircle:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  vcPlayCircleInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)', alignItems: 'center', justifyContent: 'center' },
  vcDurationBadge:   { position: 'absolute', bottom: 5, right: 6, backgroundColor: 'rgba(0,0,0,0.80)', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  vcDurationText:    { fontSize: 9, color: '#FFF', fontWeight: FontWeight.bold },
  vcCatBadge:        { position: 'absolute', top: 6, left: 6, borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  vcCatBadgeText:    { fontSize: 9, color: '#FFF', fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  vcTitle:    { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, lineHeight: 17, marginBottom: 2 },
  vcSubtitle: { fontSize: FontSize.micro, color: Colors.textMuted },

  // ── Article cards ───────────────────────────────────────────────────────────
  articleCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  acAccent:   { width: 4 },
  acBody:     { flex: 1, padding: Spacing.base, gap: 6 },
  acTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  acTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acTagPill:  { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  acTagText:  { fontSize: FontSize.micro, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  acReadTime: { fontSize: FontSize.caption, color: Colors.textMuted },
  acIconBadge:{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acTitle:    { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 22 },
  acSummary:  { fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },
  acFooter:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  acReadMore: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold },

  // ── Video modal ─────────────────────────────────────────────────────────────
  vmContainer: { flex: 1, backgroundColor: '#000' },
  vmHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#111',
  },
  vmTitleRow:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginRight: Spacing.md },
  vmTitle:       { flex: 1, fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: '#FFF' },
  vmClose: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.md,
    minWidth: 72,
    justifyContent: 'center',
  },
  vmCloseLabel:  { fontSize: FontSize.label, color: '#FFF', fontWeight: FontWeight.semiBold },
  vmWebView:     { flex: 1, backgroundColor: '#000' },
  vmLoading:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  vmLoadingText: { fontSize: FontSize.label, color: 'rgba(255,255,255,0.55)' },

  // ── Article modal ────────────────────────────────────────────────────────────
  amContainer: { flex: 1, backgroundColor: Colors.background },

  // Floating nav row — absolutely positioned, SafeAreaView inside provides top inset
  amFloatBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
  },

  amFloatBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  amFloatTagWrap: { flex: 1, alignItems: 'center' },
  amFloatTag: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: '#FFF', letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  // Banner
  amBanner: { height: 240, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  amBannerCircle1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    borderWidth: 60, borderColor: 'rgba(255,255,255,0.10)',
    top: -120, right: -80,
  },
  amBannerCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    borderWidth: 40, borderColor: 'rgba(255,255,255,0.07)',
    bottom: -70, left: -50,
  },
  amBannerCounter: {
    position: 'absolute', bottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.30)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  amBannerCounterText: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.80)', fontWeight: FontWeight.semiBold },

  // Article body
  amBody:    { backgroundColor: Colors.background, padding: Spacing.base, paddingTop: Spacing.xl },
  amMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  amTagPill: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  amTagText: { fontSize: FontSize.micro, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  amReadTime: { fontSize: FontSize.caption, color: Colors.textMuted },
  amTitle:   { fontSize: 26, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 34, marginBottom: Spacing.sm },
  amByline:  { fontSize: FontSize.caption, color: Colors.textMuted, marginBottom: Spacing.lg },
  amDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  amPara:    { fontSize: 15, color: Colors.textSecondary, lineHeight: 25, marginBottom: Spacing.lg },

  // Prev / Next navigation
  amNavDivider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  amNavHeading: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing.md },
  amNavCards:   { flexDirection: 'row', gap: Spacing.md },
  amNavCard: {
    flex: 1,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 6, overflow: 'hidden',
  },
  amNavCardBlank: { flex: 1 },
  amNavCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amNavDir:        { fontSize: FontSize.micro, fontWeight: FontWeight.bold, letterSpacing: 0.5, textTransform: 'uppercase' },
  amNavCardTitle:  { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, lineHeight: 17 },
  amNavCardAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
});
