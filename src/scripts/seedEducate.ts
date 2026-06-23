import { prisma } from '../config/database';
import { EducateDomain } from '@prisma/client';

interface LessonFrame {
  title: string;
  duration: number;
  overview: string;
  concepts: string[];
  actionTask: string;
  reflection: string;
}

interface PhaseFrame {
  title: string;
  lessons: LessonFrame[];
}

interface PathSeed {
  slug: string;
  domain: EducateDomain;
  title: string;
  tagline: string;
  description: string;
  circleTag: string;
  sortOrder: number;
  phases: PhaseFrame[];
}

const PATHS: PathSeed[] = [
  {
    slug: 'ai-for-entrepreneurs',
    domain: EducateDomain.AI_AUTOMATION,
    title: 'AI for Entrepreneurs',
    tagline: 'Use AI to build faster, decide smarter, and scale efficiently.',
    description: 'A practical roadmap for entrepreneurs who want to integrate AI into their business — from understanding the basics to deploying autonomous agents.',
    circleTag: 'AI',
    sortOrder: 1,
    phases: [
      {
        title: 'AI Fundamentals',
        lessons: [
          {
            title: 'What AI Actually Is',
            duration: 8,
            overview: 'Most business owners use AI with assumptions that limit their results. This lesson replaces the myths with a clear, accurate picture of what today\'s AI tools actually do — so you can use them confidently.',
            concepts: ['Machine learning vs AI vs automation', 'How LLMs work', 'What AI can and cannot do'],
            actionTask: 'List 3 tasks in your business that are repetitive and rule-based.',
            reflection: 'Which of these tasks would free up the most time if AI handled them?',
          },
          {
            title: 'The AI Landscape Today',
            duration: 10,
            overview: 'There are hundreds of AI tools and it\'s easy to get lost. This lesson maps the territory — text, image, voice, code, and video AI — so you know what to reach for and when.',
            concepts: ['Categories: text, image, voice, code, video AI', 'Key tools: ChatGPT, Claude, Gemini, Midjourney', 'Open source vs proprietary models'],
            actionTask: 'Try one free AI tool for a real business task this week.',
            reflection: 'What surprised you about the tool\'s output?',
          },
          {
            title: 'AI Thinking Patterns',
            duration: 7,
            overview: 'AI predicts the next likely output based on patterns, not reasoning. Understanding this distinction changes how you prompt, verify, and trust AI outputs in your business.',
            concepts: ['Probabilistic reasoning', 'Token prediction', 'Why AI hallucinates', 'Confidence calibration'],
            actionTask: 'Find one AI output that was incorrect and reason through why it happened.',
            reflection: 'How does understanding hallucination change how you\'ll use AI?',
          },
        ],
      },
      {
        title: 'Prompt Engineering',
        lessons: [
          {
            title: 'The Anatomy of a Good Prompt',
            duration: 10,
            overview: 'The quality of your AI output is almost entirely determined by the quality of your prompt. This lesson teaches the four-part structure that turns vague requests into precise, useful responses.',
            concepts: ['Role, context, task, format', 'Zero-shot vs few-shot prompting', 'Chain-of-thought prompting'],
            actionTask: 'Rewrite a bad prompt you\'ve used before using the role-context-task-format structure.',
            reflection: 'What changed in the output quality?',
          },
          {
            title: 'Prompts for Business',
            duration: 12,
            overview: 'Theory is useful; results are better. This lesson applies prompt engineering directly to the writing tasks you face every week — emails, proposals, SOPs, and content.',
            concepts: ['Drafting emails, proposals, and SOPs', 'Extracting insights from documents', 'Generating structured data from unstructured text'],
            actionTask: 'Use AI to write your company\'s FAQ page from bullet notes.',
            reflection: 'Where did the AI add value? Where did it miss context only you know?',
          },
          {
            title: 'Prompt Systems and Templates',
            duration: 9,
            overview: 'A single great prompt is valuable. A shared library of tested templates that your whole team can use is a competitive advantage. This lesson shows you how to build one.',
            concepts: ['Building reusable prompt templates', 'Prompt versioning', 'Team prompt libraries'],
            actionTask: 'Create a prompt template for your most common business writing task.',
            reflection: 'How would your team benefit from a shared prompt library?',
          },
        ],
      },
      {
        title: 'Automation Systems',
        lessons: [
          {
            title: 'Mapping Your Automation Opportunities',
            duration: 10,
            overview: 'Not all automation creates value — some creates complexity. This lesson teaches you to identify where automation creates real leverage and where it would create more problems than it solves.',
            concepts: ['The automation pyramid: data → logic → action', 'High-ROI vs low-ROI automation targets', 'Integration vs custom build'],
            actionTask: 'Draw your top 3 business workflows and mark which steps are automatable.',
            reflection: 'Which workflow, if automated, would have the highest business impact?',
          },
          {
            title: 'No-Code AI Tools',
            duration: 12,
            overview: 'You don\'t need to write code to automate significant parts of your business. This lesson walks through the most powerful no-code AI platforms and how to connect them to your existing workflow.',
            concepts: ['Make.com / Zapier for connecting apps', 'Notion AI for knowledge management', 'ChatGPT plugins and custom GPTs'],
            actionTask: 'Set up one simple automation (e.g., email → summary → Slack message).',
            reflection: 'What did this automation reveal about your existing workflow?',
          },
          {
            title: 'AI in Your Sales and Marketing',
            duration: 11,
            overview: 'AI can accelerate every stage of your sales and marketing — from qualifying leads to personalizing outreach to generating content at scale. This lesson shows you where to apply it first.',
            concepts: ['Lead scoring with AI', 'Personalized outreach at scale', 'Content generation pipelines'],
            actionTask: 'Use AI to write 5 personalized cold outreach messages from a prospect list.',
            reflection: 'How does AI-assisted personalization compare to manual effort?',
          },
        ],
      },
      {
        title: 'AI Agents',
        lessons: [
          {
            title: 'What Are AI Agents?',
            duration: 9,
            overview: 'AI agents go beyond chatbots — they take actions, use tools, and complete multi-step tasks with minimal human input. This lesson explains what they are, how they work, and where they\'re genuinely ready to use today.',
            concepts: ['Agents vs chatbots', 'Tool use and memory', 'Multi-step reasoning'],
            actionTask: 'Research one AI agent framework (n8n, CrewAI, AutoGen) and document one use case.',
            reflection: 'What would you trust an agent to do autonomously in your business?',
          },
          {
            title: 'Building a Simple AI Agent',
            duration: 14,
            overview: 'You don\'t need to be an engineer to design an effective AI agent. This lesson walks through the core components — goals, tools, constraints, and human checkpoints — so you can plan one for your own business.',
            concepts: ['Defining agent goals and constraints', 'Tool calling basics', 'Human-in-the-loop checkpoints'],
            actionTask: 'Design (on paper) an agent that handles one routine business task end-to-end.',
            reflection: 'Where are the points where human judgment is irreplaceable?',
          },
          {
            title: 'Agent Safety and Oversight',
            duration: 8,
            overview: 'Autonomy without accountability is a liability. This lesson covers the guardrails, logging, and approval flows you need before any AI agent acts on your behalf.',
            concepts: ['Guardrails and approval flows', 'Logging and auditing agent actions', 'When agents fail'],
            actionTask: 'Write a one-page policy for how your business would deploy AI agents safely.',
            reflection: 'What is the cost of an agent making an autonomous mistake in your context?',
          },
        ],
      },
      {
        title: 'Business Applications',
        lessons: [
          {
            title: 'AI-Powered Decision Making',
            duration: 11,
            overview: 'Most business decisions involve more data than any human can fully process. This lesson shows you how to use AI as a thinking partner to surface insights, stress-test assumptions, and improve decision quality.',
            concepts: ['Data analysis with AI', 'Scenario planning', 'Reducing cognitive bias'],
            actionTask: 'Feed one business decision (past or current) into AI and compare its analysis to yours.',
            reflection: 'What did AI surface that you hadn\'t considered?',
          },
          {
            title: 'Building AI Into Your Team',
            duration: 10,
            overview: 'Technology creates AI potential; adoption creates AI advantage. This lesson covers how to introduce AI into your team effectively — including training, policy, and the change management that makes it stick.',
            concepts: ['AI adoption and change management', 'Training non-technical team members', 'Setting AI usage policies'],
            actionTask: 'Write a one-paragraph AI policy for your team\'s acceptable use.',
            reflection: 'What resistance do you anticipate, and how will you address it?',
          },
          {
            title: 'Your AI Roadmap',
            duration: 12,
            overview: 'You\'ve learned the tools and concepts. Now it\'s time to build your 90-day AI integration plan with specific milestones and measurable goals for your business.',
            concepts: ['Prioritizing AI investments', '30-60-90 day implementation plan', 'Measuring AI ROI'],
            actionTask: 'Create your 90-day AI integration plan with 3 specific milestones.',
            reflection: 'What is the one AI change that would most transform your business this quarter?',
          },
        ],
      },
    ],
  },

  {
    slug: 'entrepreneurship-fundamentals',
    domain: EducateDomain.ENTREPRENEURSHIP,
    title: 'Entrepreneurship Fundamentals',
    tagline: 'From idea to impact — the principles that build lasting businesses.',
    description: 'A structured journey through entrepreneurial thinking, validation, building, growth, and scaling — grounded in real-world principles, not hype.',
    circleTag: 'Entrepreneurs',
    sortOrder: 2,
    phases: [
      {
        title: 'Mindset & Foundation',
        lessons: [
          {
            title: 'The Entrepreneurial Mindset',
            duration: 9,
            overview: 'Entrepreneurship isn\'t a personality type — it\'s a set of trainable thinking patterns. This lesson identifies the specific mental habits that separate entrepreneurs who build lasting things from those who stay stuck in ideation.',
            concepts: ['Opportunity vs problem orientation', 'Risk tolerance and calculated bets', 'Long-term vs short-term thinking'],
            actionTask: 'Journal for 10 minutes on a problem you encounter every week that no one has solved well.',
            reflection: 'Is your attraction to entrepreneurship driven by opportunity or escape?',
          },
          {
            title: 'Understanding Your "Why"',
            duration: 8,
            overview: 'The businesses that survive their hardest years are almost always built on a purpose that outlasts the initial excitement. This lesson helps you find and articulate the mission that will sustain you through difficulty.',
            concepts: ['Purpose-driven vs profit-driven ventures', 'Mission alignment', 'Sustainability of motivation'],
            actionTask: 'Write your founding story in 200 words as if telling it 5 years from now.',
            reflection: 'Is your "why" strong enough to sustain you through failure?',
          },
          {
            title: 'First Principles Thinking',
            duration: 10,
            overview: 'Most markets are shaped by inherited assumptions nobody has questioned in years. This lesson teaches you to identify and challenge those assumptions — which is where real entrepreneurial opportunity lives.',
            concepts: ['Breaking assumptions', 'Reasoning from fundamentals', 'Avoiding cargo cult entrepreneurship'],
            actionTask: 'Take one industry assumption and challenge it with first principles reasoning.',
            reflection: 'What would you build if the current industry standard didn\'t exist?',
          },
        ],
      },
      {
        title: 'Idea Validation',
        lessons: [
          {
            title: 'The Problem First Principle',
            duration: 9,
            overview: 'The fastest way to fail in business is to fall in love with your solution before understanding the problem. This lesson teaches the discipline of starting with the customer\'s pain — not your idea.',
            concepts: ['Pain points vs nice-to-haves', 'Market size estimation', 'Talking to customers before building'],
            actionTask: 'Conduct 5 customer discovery conversations about the problem you want to solve.',
            reflection: 'What surprised you most about what customers actually care about?',
          },
          {
            title: 'Competitive Analysis',
            duration: 10,
            overview: 'Understanding your competitive landscape tells you where there\'s room to win and where fighting would be wasteful. This lesson teaches you to map it accurately and find your genuine advantage.',
            concepts: ['Direct vs indirect competitors', 'Finding whitespace', 'Your unfair advantage'],
            actionTask: 'Map your competitive landscape on a 2x2 matrix (price vs quality).',
            reflection: 'Where on this map could you win with your current resources?',
          },
          {
            title: 'The Minimum Viable Test',
            duration: 11,
            overview: 'You don\'t need to build a product to test whether people want it. This lesson teaches you how to validate real demand in days, not months, using the simplest possible experiments.',
            concepts: ['MVP vs MLP', 'Smoke tests and landing pages', 'Measuring demand before building'],
            actionTask: 'Design a 1-week test to validate whether people will pay for your idea without building it.',
            reflection: 'What evidence would convince you this idea is worth 6 months of your life?',
          },
        ],
      },
      {
        title: 'Building & Launching',
        lessons: [
          {
            title: 'Building Fast Without Breaking Things',
            duration: 10,
            overview: 'Speed matters in early-stage building, but only if you\'re building the right things. This lesson teaches you to identify what\'s essential in v1 — and ruthlessly cut everything else.',
            concepts: ['Lean startup principles', 'Build-measure-learn cycle', 'Technical debt decisions'],
            actionTask: 'Define the 3 core features of your product and the 10 things you will NOT build in v1.',
            reflection: 'What is the simplest version that would create real value for one customer?',
          },
          {
            title: 'Your First Sale',
            duration: 12,
            overview: 'The first sale is the most important one — not for the revenue, but for what it teaches you. This lesson prepares you to make your first real offer to a real customer.',
            concepts: ['Manual before automated', 'Founder-led sales', 'Pricing your early offer'],
            actionTask: 'Make your first offer to a real potential customer — in person or over a call.',
            reflection: 'What objections came up, and what did they reveal about your product or pricing?',
          },
          {
            title: 'Launch Strategy',
            duration: 9,
            overview: 'A launch without a strategy is just a public debut. This lesson builds a simple, executable launch plan around the channels and communities most likely to contain your first customers.',
            concepts: ['Soft launch vs public launch', 'Pre-launch community building', 'Launch channels that match your audience'],
            actionTask: 'Write your launch plan: channel, message, date, and one measurable goal.',
            reflection: 'Who are the 10 people who will become your earliest advocates, and how will you reach them?',
          },
        ],
      },
      {
        title: 'Growth',
        lessons: [
          {
            title: 'Product-Market Fit',
            duration: 11,
            overview: 'Product-market fit is the most important milestone in any startup\'s early life — and one of the most misunderstood. This lesson teaches you how to recognize it, measure it, and pursue it systematically.',
            concepts: ['The PMF feeling', 'Retention as the signal', 'When to scale vs when to pivot'],
            actionTask: 'Survey your current users: "How would you feel if you could no longer use this product?"',
            reflection: 'What would it take to reach 40% "very disappointed" responses?',
          },
          {
            title: 'Growth Channels',
            duration: 10,
            overview: 'Every business has channels that fit its product and audience — and channels that drain resources without results. This lesson helps you identify and prioritize the growth channels most likely to work for you.',
            concepts: ['Paid vs organic vs viral growth', 'Channel-product fit', 'Unit economics'],
            actionTask: 'Run one small experiment in a growth channel you haven\'t tried.',
            reflection: 'What was your CAC, and is it sustainable?',
          },
          {
            title: 'Team and Culture',
            duration: 9,
            overview: 'Your first hires set the tone for everything that follows. This lesson covers who to hire first, how to define your culture before it defines itself, and when to build systems instead of people.',
            concepts: ['First hires', 'Culture as competitive advantage', 'When to hire vs when to build systems'],
            actionTask: 'Write the values of your company culture in 5 sentences.',
            reflection: 'Would your current team describe the culture the same way you just did?',
          },
        ],
      },
      {
        title: 'Scale & Impact',
        lessons: [
          {
            title: 'Systems Over Heroics',
            duration: 10,
            overview: 'Businesses that depend on founder heroics don\'t scale — they clone. This lesson teaches you to replace yourself in the processes you\'re currently the bottleneck for.',
            concepts: ['Processes and SOPs', 'Decision delegation', 'CEO vs operator mindset'],
            actionTask: 'Document one process that only you currently do so someone else could do it.',
            reflection: 'What would you do with the time you get back if this was no longer your job?',
          },
          {
            title: 'Impact Measurement',
            duration: 9,
            overview: 'The businesses that last are the ones that create value for more than just their shareholders. This lesson shows you how to define and measure your organization\'s real-world impact.',
            concepts: ['Social return on investment', 'Stakeholder value beyond shareholders', 'Purpose and profit alignment'],
            actionTask: 'Define 3 non-financial metrics that measure your company\'s impact.',
            reflection: 'Are you building a business that you\'d be proud of in 20 years?',
          },
          {
            title: 'Your Entrepreneurial Legacy',
            duration: 11,
            overview: 'Every business eventually ends, transitions, or transforms. This lesson asks you to think about the legacy you\'re building — and whether your current trajectory leads there.',
            concepts: ['Exit options and succession', 'Building to last', 'Giving back to the ecosystem'],
            actionTask: 'Write a one-page vision for what your company looks like in 10 years.',
            reflection: 'What would need to be true about you as a leader for that vision to become real?',
          },
        ],
      },
    ],
  },

  {
    slug: 'sales-mastery',
    domain: EducateDomain.SALES,
    title: 'Sales Mastery',
    tagline: 'From conversation to closed — the complete sales framework.',
    description: 'A practical, human-centered approach to sales — covering prospecting, qualifying, presenting, closing, and building long-term client relationships.',
    circleTag: 'Sales',
    sortOrder: 3,
    phases: [
      {
        title: 'Sales Fundamentals',
        lessons: [
          {
            title: 'The Truth About Sales',
            duration: 8,
            overview: 'Most people approach sales wrong — as something you do to people, not for them. This lesson reframes sales as an act of service and establishes the values that produce both results and integrity.',
            concepts: ['Helping vs persuading', 'Value creation vs extraction', 'Trust as the foundation of sales'],
            actionTask: 'Recall your best buying experience. What made the seller trustworthy?',
            reflection: 'What does your current sales approach say about how you view your customers?',
          },
          {
            title: 'Understanding Buyer Psychology',
            duration: 10,
            overview: 'Buyers make decisions emotionally and justify them rationally. This lesson gives you the frameworks to understand what your customers actually experience when they\'re considering a purchase.',
            concepts: ['Emotional vs rational decisions', 'The job-to-be-done framework', 'Loss aversion in buying'],
            actionTask: 'Map the emotional journey your ideal customer goes through before buying.',
            reflection: 'At which point in the journey does your current approach show up?',
          },
          {
            title: 'Your Sales Process',
            duration: 9,
            overview: 'A repeatable sales process is the difference between consistent revenue and guesswork. This lesson teaches you to map your current process and diagnose exactly where you\'re losing deals.',
            concepts: ['Stages: awareness → interest → decision → action', 'Conversion rates at each stage', 'Diagnosing where you\'re losing deals'],
            actionTask: 'Draw your current sales process and mark the stage where most deals fall out.',
            reflection: 'What is the underlying reason deals fall out at that stage?',
          },
        ],
      },
      {
        title: 'Prospecting & Outreach',
        lessons: [
          {
            title: 'Defining Your Ideal Client',
            duration: 9,
            overview: 'Trying to sell to everyone means selling to no one. This lesson helps you define the specific type of client you can serve best — and shows why narrowing down actually expands your results.',
            concepts: ['ICP: industry, size, role, pain point', 'Negative personas', 'Lifetime value estimation'],
            actionTask: 'Write your ideal client profile in one detailed paragraph.',
            reflection: 'How close is your current client base to this profile?',
          },
          {
            title: 'Outreach That Works',
            duration: 11,
            overview: 'Generic outreach gets ignored. Personalized, research-backed outreach that leads with value gets responses. This lesson teaches you the structure and psychology of messages that open conversations.',
            concepts: ['Personalization at scale', 'Subject lines and opening sentences', 'Multi-touch sequences'],
            actionTask: 'Write 3 outreach messages to 3 different prospects using the research-value-ask structure.',
            reflection: 'What would make you respond to this message if you received it?',
          },
          {
            title: 'The Discovery Call',
            duration: 12,
            overview: 'The discovery call is the most important conversation in the sales process — it\'s where you either earn trust or lose it. This lesson teaches you to ask better questions and truly listen to the answers.',
            concepts: ['SPIN and MEDDIC frameworks', 'Active listening skills', 'Uncovering the real problem'],
            actionTask: 'Record yourself on a mock discovery call and review for talking vs listening ratio.',
            reflection: 'What questions could you ask that would make prospects feel truly heard?',
          },
        ],
      },
      {
        title: 'Closing & Negotiation',
        lessons: [
          {
            title: 'Presenting Solutions',
            duration: 10,
            overview: 'The best presentations aren\'t about your product — they\'re about the customer\'s future. This lesson teaches you to tailor every presentation to what you learned in discovery.',
            concepts: ['Tailoring the demo to the discovery', 'Before-and-after framing', 'Making the ROI tangible'],
            actionTask: 'Rewrite your standard pitch as a story about a specific customer\'s transformation.',
            reflection: 'Does your pitch talk more about your product or about the customer\'s future?',
          },
          {
            title: 'Handling Objections',
            duration: 11,
            overview: 'Objections aren\'t rejections — they\'re requests for more information or reassurance. This lesson gives you a framework for handling the most common objections with honesty and confidence.',
            concepts: ['Price, timing, need, trust objections', 'Acknowledge-ask-address framework', 'The objection behind the objection'],
            actionTask: 'List your top 5 objections and write a response that addresses the emotion first.',
            reflection: 'Which objection are you most uncomfortable hearing, and why?',
          },
          {
            title: 'Closing Techniques That Respect Buyers',
            duration: 9,
            overview: 'The best close isn\'t a trick — it\'s a natural next step that both parties are ready for. This lesson teaches you to create momentum toward a decision without pressure or manipulation.',
            concepts: ['Assumptive vs consultative close', 'Trial closes', 'Creating urgency without pressure'],
            actionTask: 'Role-play the closing conversation of a recent lost deal with a colleague.',
            reflection: 'At what point in the conversation did you lose momentum, and what could you have done differently?',
          },
        ],
      },
      {
        title: 'Retention & Growth',
        lessons: [
          {
            title: 'The Onboarding That Sells Again',
            duration: 9,
            overview: 'The deal closes, but the relationship is just beginning. A great onboarding experience is the highest-leverage investment in client retention and expansion you can make.',
            concepts: ['First 90 days as a sales moment', 'Success milestones', 'Expansion signals'],
            actionTask: 'Map your current client onboarding and identify where clients go quiet.',
            reflection: 'What would you want a client to say about your onboarding to a friend?',
          },
          {
            title: 'Referral Systems',
            duration: 10,
            overview: 'A happy client who never refers you is a missed opportunity. This lesson teaches you to build referral-generating conversations and systems into your regular client relationships.',
            concepts: ['Timing the ask', 'Making referrals easy', 'Building a referral culture'],
            actionTask: 'Identify your 5 happiest clients and design a referral conversation for each.',
            reflection: 'Why haven\'t you asked these clients for a referral yet?',
          },
          {
            title: 'Building a Sales System',
            duration: 11,
            overview: 'Individual sales skill is important; a reliable sales system is essential. This lesson helps you build the CRM habits, pipeline reviews, and metrics that make your results consistent.',
            concepts: ['CRM habits', 'Pipeline reviews', 'Sales metrics that matter'],
            actionTask: 'Set up a simple weekly sales review ritual: pipeline, next actions, blockers.',
            reflection: 'What one metric, if improved by 20%, would most impact your revenue?',
          },
        ],
      },
    ],
  },

  {
    slug: 'leadership-essentials',
    domain: EducateDomain.LEADERSHIP,
    title: 'Leadership Essentials',
    tagline: 'Lead yourself first. Then lead others toward meaningful goals.',
    description: 'A grounded leadership curriculum covering self-mastery, team dynamics, strategy, and building a lasting legacy — without the leadership clichés.',
    circleTag: 'Leadership',
    sortOrder: 4,
    phases: [
      {
        title: 'Self-Leadership',
        lessons: [
          {
            title: 'The Leader You Are Today',
            duration: 9,
            overview: 'You can\'t lead others effectively until you understand how you\'re being experienced. This lesson creates an honest baseline of your current leadership strengths and blind spots.',
            concepts: ['Self-awareness as foundation', 'Leadership styles and their contexts', 'Identifying your default patterns'],
            actionTask: 'Ask 3 people who work with you: "What is it like to be led by me?"',
            reflection: 'How close is their answer to how you see yourself?',
          },
          {
            title: 'Managing Your Energy',
            duration: 8,
            overview: 'Your decision quality and emotional presence are directly tied to your physical and mental energy. This lesson helps you design a workday that protects your capacity for high-quality leadership.',
            concepts: ['Decision fatigue', 'Peak performance rhythms', 'Emotional regulation under pressure'],
            actionTask: 'Track your energy levels hourly for 3 days and identify your high-performance windows.',
            reflection: 'Are your most important decisions being made in your high-energy windows?',
          },
          {
            title: 'The Courage to Lead',
            duration: 10,
            overview: 'Leadership requires doing hard things — hard conversations, unpopular decisions, honest feedback. This lesson builds the specific courage that distinguishes great leaders from competent managers.',
            concepts: ['Vulnerability as strength', 'Hard conversations', 'Leading through uncertainty'],
            actionTask: 'Have one conversation you have been avoiding for more than 2 weeks.',
            reflection: 'What did the conversation reveal about your relationship with conflict?',
          },
        ],
      },
      {
        title: 'Team Leadership',
        lessons: [
          {
            title: 'Building Psychological Safety',
            duration: 10,
            overview: 'Teams perform best when members feel safe to speak up, take risks, and admit mistakes. This lesson explains the research behind psychological safety and the specific behaviors that build or destroy it.',
            concepts: ['Google\'s Project Aristotle findings', 'Creating space for dissent', 'Trust vs comfort'],
            actionTask: 'At your next team meeting, ask the group: "What is something we should be doing differently?"',
            reflection: 'What does the quality of the responses tell you about psychological safety on your team?',
          },
          {
            title: 'Delegation and Accountability',
            duration: 11,
            overview: 'Most leaders delegate too little, too late, and with unclear expectations. This lesson teaches the delegation ladder — a framework for transferring ownership in a way that develops your people without losing control.',
            concepts: ['The delegation ladder', 'Clear expectations vs micromanagement', 'Accountability without blame'],
            actionTask: 'Choose one task you own that someone on your team should own instead. Delegate it this week.',
            reflection: 'What does your reluctance to delegate reveal about you?',
          },
          {
            title: 'Feedback as a Leadership Tool',
            duration: 9,
            overview: 'The gap between most teams\' potential and their actual performance is often explained by a lack of honest, timely feedback. This lesson teaches you to give feedback that changes behavior without damaging relationships.',
            concepts: ['SBI model: Situation-Behavior-Impact', 'Radical candor', 'Creating a feedback culture'],
            actionTask: 'Give one piece of specific, actionable, kind feedback to a team member today.',
            reflection: 'What stopped you from giving this feedback earlier?',
          },
        ],
      },
      {
        title: 'Strategic Leadership',
        lessons: [
          {
            title: 'Thinking in Systems',
            duration: 10,
            overview: 'Short-term thinking is the most common leadership failure. This lesson teaches you to identify second-order effects and leverage points so your decisions create compounding value instead of whack-a-mole problems.',
            concepts: ['First-order vs second-order effects', 'Leverage points', 'Long-game decision making'],
            actionTask: 'Map the second-order effects of a decision you made in the last 6 months.',
            reflection: 'What would you have decided differently if you had thought two steps ahead?',
          },
          {
            title: 'Communicating Vision',
            duration: 9,
            overview: 'Strategy is worthless if people can\'t understand and internalize it. This lesson teaches you to make your vision concrete, memorable, and repeatable — so it can actually guide behavior.',
            concepts: ['Making the abstract concrete', 'Storytelling for strategy', 'Repeated, consistent messaging'],
            actionTask: 'Write your team\'s vision as a one-paragraph story set 3 years in the future.',
            reflection: 'Could your team recite the core of this vision without reading it?',
          },
          {
            title: 'Leading Through Change',
            duration: 11,
            overview: 'Change resistance is rational, not irrational. This lesson gives you the frameworks to understand why people resist, how to build coalitions, and how to lead transformation without losing your best people.',
            concepts: ['Change resistance patterns', 'The change curve', 'Coalition building'],
            actionTask: 'Identify who on your team is most resistant to a current change, and schedule a 1:1 with them.',
            reflection: 'What legitimate concerns might their resistance be hiding?',
          },
        ],
      },
      {
        title: 'Legacy Leadership',
        lessons: [
          {
            title: 'Growing Leaders Around You',
            duration: 10,
            overview: 'The highest expression of leadership isn\'t your own performance — it\'s the number of leaders you\'ve developed. This lesson teaches you the specific moves that transform high performers into future leaders.',
            concepts: ['Multiplier vs diminisher leaders', 'Mentorship vs sponsorship', 'Creating leadership pipelines'],
            actionTask: 'Identify one person on your team you could deliberately develop into a leader. Make a plan.',
            reflection: 'What would your organization look like if everyone you led became a leader too?',
          },
          {
            title: 'Ethical Leadership',
            duration: 9,
            overview: 'Values are easiest to hold when they cost nothing. This lesson explores what leadership integrity actually looks like under pressure — when values collide with convenience, politics, or personal benefit.',
            concepts: ['Values under pressure', 'Power and accountability', 'Leading with integrity over convenience'],
            actionTask: 'Write your personal leadership manifesto: 5 principles you will never compromise.',
            reflection: 'Have you ever compromised one of these principles? What were the consequences?',
          },
          {
            title: 'Your Leadership Legacy',
            duration: 11,
            overview: 'The leaders who are remembered most aren\'t those who achieved the most personally — they\'re those who transformed the people around them. This lesson asks what you want your leadership story to be.',
            concepts: ['How leaders are remembered', 'Impact beyond the org chart', 'Leadership as service'],
            actionTask: 'Write your leadership eulogy: what would your team say about working with you?',
            reflection: 'What would you need to change today for that eulogy to be true?',
          },
        ],
      },
    ],
  },

  {
    slug: 'networking-excellence',
    domain: EducateDomain.NETWORKING,
    title: 'Networking Excellence',
    tagline: 'Build a network of genuine relationships that compound over time.',
    description: 'A values-based networking curriculum that focuses on authentic connection, strategic relationship building, and creating mutual value — not transactional contact collection.',
    circleTag: 'Networking',
    sortOrder: 5,
    phases: [
      {
        title: 'Network Mindset',
        lessons: [
          {
            title: 'Redefining Networking',
            duration: 8,
            overview: 'Most people think of networking as collecting contacts. The best networkers think of it as building relationships — and that distinction changes everything about how they show up.',
            concepts: ['Generosity vs extraction', 'Weak ties and strong ties', 'Network quality vs quantity'],
            actionTask: 'Identify 3 people in your network you have given the most to. Have you maintained these relationships?',
            reflection: 'What does your networking approach say about your underlying values?',
          },
          {
            title: 'Mapping Your Current Network',
            duration: 9,
            overview: 'You already have a network. The question is whether it\'s the right shape for where you\'re trying to go. This lesson teaches you to visualize your current relationships and identify the gaps.',
            concepts: ['Network visualization', 'Identifying gaps by domain and geography', 'Diversity of thought in your network'],
            actionTask: 'Draw your network map: who are your top 20 relationships and how are they connected?',
            reflection: 'What does the shape of your current network tell you about who you spend time with?',
          },
          {
            title: 'The Long Game',
            duration: 8,
            overview: 'The most valuable professional relationships are built over years, not engineered in an afternoon. This lesson makes the case for playing the long game — and shows you what that actually looks like in practice.',
            concepts: ['Compounding relationships', 'Reputation as infrastructure', 'Playing infinite vs finite games'],
            actionTask: 'Identify one relationship you let fade. Reach out today with no agenda.',
            reflection: 'Why did you stop maintaining this relationship, and what did you lose as a result?',
          },
        ],
      },
      {
        title: 'Building Connections',
        lessons: [
          {
            title: 'The Art of the Introduction',
            duration: 9,
            overview: 'Your first message to someone sets the tone for the entire relationship. This lesson teaches you to reach out in a way that leads with genuine value and makes it easy for the other person to say yes.',
            concepts: ['Research before reaching out', 'Opening with value not ask', 'The 5-sentence outreach formula'],
            actionTask: 'Write an outreach message to someone you admire, offering something of value with no ask.',
            reflection: 'What would you want someone to say when they first reach out to you?',
          },
          {
            title: 'Making Events Count',
            duration: 10,
            overview: 'Most people leave networking events with a stack of cards and no real connections. This lesson teaches you to invest in depth rather than breadth — and how to follow up in a way that actually builds relationships.',
            concepts: ['Quality over quantity at events', 'Deep vs shallow conversations', 'Following up while memory is fresh'],
            actionTask: 'At your next event, commit to 3 deep conversations instead of 20 business card exchanges.',
            reflection: 'What made those 3 conversations meaningful or unmemorable?',
          },
          {
            title: 'Building in Community',
            duration: 9,
            overview: 'The most efficient networking isn\'t one-on-one — it\'s becoming a valued member of a community where your ideal contacts already gather. This lesson shows you how to become known for something specific.',
            concepts: ['Contributing to shared spaces', 'Being known for something specific', 'Generosity that creates gravity'],
            actionTask: 'Choose one community and commit to contributing value every week for the next month.',
            reflection: 'What is the one thing you want people in your community to associate with your name?',
          },
        ],
      },
      {
        title: 'Maintaining Relationships',
        lessons: [
          {
            title: 'Systems for Staying in Touch',
            duration: 8,
            overview: 'Relationships fade without maintenance. This lesson teaches you to build lightweight systems for staying in touch with the people who matter most — without it feeling mechanical or forced.',
            concepts: ['The give-give-ask rhythm', 'CRM for relationships', 'Thoughtful vs automated follow-ups'],
            actionTask: 'Set up a simple system to follow up with 5 key contacts each week without it feeling mechanical.',
            reflection: 'What would the people you want to stay close to say about how you show up for them?',
          },
          {
            title: 'Being the Connector',
            duration: 10,
            overview: 'The most valuable people in any network aren\'t necessarily the most successful — they\'re the ones who introduce others. This lesson teaches you the art and the leverage of being a connector.',
            concepts: ['Super-connector positioning', 'Making the right introduction', 'Creating network effects for others'],
            actionTask: 'Make one introduction between two people in your network who should know each other.',
            reflection: 'What stopped you from making this introduction sooner?',
          },
          {
            title: 'Navigating Difficult Relationships',
            duration: 9,
            overview: 'Not every professional relationship ages well. This lesson teaches you to recognize when to invest more, when to hold steady, and when to gracefully exit a relationship that\'s no longer working.',
            concepts: ['Setting relationship boundaries', 'Ending transactional relationships gracefully', 'Repairing trust'],
            actionTask: 'Identify one relationship in your network that is draining. Decide: invest or gracefully exit.',
            reflection: 'Are there relationships you maintain out of obligation rather than mutual value?',
          },
        ],
      },
      {
        title: 'Network Effects',
        lessons: [
          {
            title: 'Building Your Reputation Online',
            duration: 10,
            overview: 'Your online presence is often the first thing someone checks before deciding whether to meet you. This lesson teaches you to build an online reputation that opens doors rather than closing them.',
            concepts: ['Content as networking', 'Consistency of message', 'Intellectual generosity'],
            actionTask: 'Write one piece of content that teaches something useful to your target network.',
            reflection: 'What knowledge do you have that others in your field would genuinely value?',
          },
          {
            title: 'Leveraging Your Network for Opportunities',
            duration: 11,
            overview: 'A strong network is only valuable if you can activate it when you need it. This lesson teaches you the timing, framing, and specificity that make asks easy to fulfill.',
            concepts: ['Asking well', 'Making asks easy to fulfill', 'Timing the ask'],
            actionTask: 'Identify one specific opportunity you need. Map which contact in your network is closest to it.',
            reflection: 'What have you given this person that makes your ask reasonable?',
          },
          {
            title: 'Your Network as a Legacy',
            duration: 9,
            overview: 'The most generative thing you can do with a strong network is use it to create community — gatherings, introductions, and shared experiences that didn\'t exist before you.',
            concepts: ['Network stewardship', 'Paying it forward', 'Creating community from your network'],
            actionTask: 'Host a small gathering of 8-10 people from your network who would benefit from knowing each other.',
            reflection: 'What community could you create that didn\'t exist before you?',
          },
        ],
      },
    ],
  },

  {
    slug: 'wealth-fundamentals',
    domain: EducateDomain.WEALTH_FUNDAMENTALS,
    title: 'Wealth Fundamentals',
    tagline: 'Build financial clarity, discipline, and long-term security.',
    description: 'A practical, jargon-free guide to personal finance and wealth building — covering mindset, saving, investing, income diversification, and wealth protection.',
    circleTag: 'Wealth',
    sortOrder: 6,
    phases: [
      {
        title: 'Money Mindset',
        lessons: [
          {
            title: 'Your Money Story',
            duration: 8,
            overview: 'Every financial decision you make is shaped by beliefs about money that were formed before you were 10 years old. This lesson helps you surface and examine those beliefs so they stop running your finances unconsciously.',
            concepts: ['Childhood money beliefs', 'Scarcity vs abundance mindset', 'Emotional triggers around money'],
            actionTask: 'Write about your first money memory and what belief it created.',
            reflection: 'How does that belief show up in your financial decisions today?',
          },
          {
            title: 'What Wealth Actually Is',
            duration: 9,
            overview: 'Most people confuse income with wealth, but they\'re not the same thing at all. This lesson reframes wealth as freedom — the ability to choose how you spend your time — and gives you a framework for measuring it accurately.',
            concepts: ['Time freedom vs money accumulation', 'Net worth vs income', 'Assets vs liabilities'],
            actionTask: 'Calculate your net worth today: assets minus liabilities.',
            reflection: 'Is your current financial behavior moving this number in the right direction?',
          },
          {
            title: 'The Cost of Financial Avoidance',
            duration: 8,
            overview: 'Financial anxiety leads to avoidance, and avoidance makes the anxiety worse. This lesson breaks the cycle by replacing anxiety with clarity — because the numbers, however uncomfortable, are more manageable when you can see them.',
            concepts: ['Financial anxiety patterns', 'The compounding cost of delay', 'Clarity as the antidote to anxiety'],
            actionTask: 'Spend 30 minutes reviewing your last 3 months of spending with no judgment.',
            reflection: 'What pattern did you see that you had been avoiding looking at?',
          },
        ],
      },
      {
        title: 'Saving & Investing',
        lessons: [
          {
            title: 'The Foundation: Emergency Fund',
            duration: 9,
            overview: 'Everything else in personal finance depends on a stable foundation. This lesson builds the case for an emergency fund and gives you a concrete plan to build one even if money is currently tight.',
            concepts: ['6-month expense cushion', 'Liquid vs invested savings', 'Automating savings before spending'],
            actionTask: 'Calculate what 6 months of expenses looks like for you. Set an automatic transfer today.',
            reflection: 'What would financial security feel like in your body if you had 6 months of expenses saved?',
          },
          {
            title: 'Investing Basics',
            duration: 12,
            overview: 'Investing feels complex but the core principles are simple: start early, diversify, keep costs low, and stay consistent. This lesson explains how compounding works and gives you the foundation to start.',
            concepts: ['Compounding over time', 'Index funds vs active funds', 'Asset allocation basics (equity, debt, gold)'],
            actionTask: 'Open or review your investment account and check your asset allocation.',
            reflection: 'Does your current allocation match your actual risk tolerance or what you think it should be?',
          },
          {
            title: 'Tax-Efficient Wealth Building',
            duration: 10,
            overview: 'You can\'t control market returns, but you can control how much you lose to taxes. This lesson shows you the legal tax-saving vehicles available to you and how to use them strategically.',
            concepts: ['Tax-advantaged accounts (PPF, NPS, ELSS)', 'Tax-loss harvesting', 'Long-term capital gains planning'],
            actionTask: 'Identify which tax-saving instruments you are underutilizing and calculate the opportunity cost.',
            reflection: 'How much money are you losing each year to taxes that could be legally reduced?',
          },
        ],
      },
      {
        title: 'Multiple Income Streams',
        lessons: [
          {
            title: 'The One-Income Risk',
            duration: 8,
            overview: 'Depending on a single income source is the most common financial vulnerability people ignore until it\'s too late. This lesson makes the case for income diversification and maps the ladder from employment to financial independence.',
            concepts: ['Income concentration risk', 'Active vs passive income', 'The income diversification ladder'],
            actionTask: 'List all your current income sources and their percentage of your total income.',
            reflection: 'If your primary income disappeared tomorrow, how long could you survive?',
          },
          {
            title: 'Building a Second Income',
            duration: 11,
            overview: 'The fastest way to diversify your income is to monetize a skill you already have. This lesson helps you identify that skill and design a realistic path to your first meaningful secondary income.',
            concepts: ['Skills monetization', 'Digital products and content', 'Consulting and freelancing'],
            actionTask: 'Identify one skill you have that someone would pay for. Research what they would pay.',
            reflection: 'What is stopping you from charging for this skill today?',
          },
          {
            title: 'Passive Income Realities',
            duration: 10,
            overview: 'Passive income is real, but it\'s not free. This lesson separates the hype from the reality — what it actually takes to build passive income, and which models make sense for your situation.',
            concepts: ['The myth of truly passive income', 'Rental income, dividends, and royalties', 'Upfront work for future cash flow'],
            actionTask: 'Research one passive income model that matches your skills and capital.',
            reflection: 'What is the real time and money investment required before this income becomes "passive"?',
          },
        ],
      },
      {
        title: 'Wealth Protection',
        lessons: [
          {
            title: 'Insurance as Wealth Protection',
            duration: 9,
            overview: 'Building wealth without protecting it is like filling a bucket with a hole in the bottom. This lesson covers the insurance fundamentals that protect your financial progress from catastrophic setbacks.',
            concepts: ['Term life insurance fundamentals', 'Health insurance gaps', 'What to insure vs what to self-insure'],
            actionTask: 'Review your current insurance coverage and identify any protection gaps.',
            reflection: 'Is your family financially protected if something happened to you tomorrow?',
          },
          {
            title: 'Estate Basics',
            duration: 8,
            overview: 'Estate planning isn\'t just for the wealthy — it\'s for anyone who wants their assets to go where they intend. This lesson covers the basics of wills, nominations, and making sure your financial legacy is clear.',
            concepts: ['Will vs trust', 'Nominee vs legal heir', 'Digital asset planning'],
            actionTask: 'Write a simple list of your assets, liabilities, and who should receive what.',
            reflection: 'Would your family know what to do with your finances if they needed to tomorrow?',
          },
          {
            title: 'Your 10-Year Financial Plan',
            duration: 12,
            overview: 'A financial plan turns vague wishes into specific targets with real timelines. This lesson helps you define your 10-year financial goals and reverse-engineer the monthly habits that will get you there.',
            concepts: ['Goal-based financial planning', 'Inflation-adjusted targets', 'Annual financial review habit'],
            actionTask: 'Write your 10-year financial goals and the monthly savings required to reach each one.',
            reflection: 'What is the gap between your current savings rate and what your goals require?',
          },
        ],
      },
    ],
  },

  {
    slug: 'navayana-buddhism',
    domain: EducateDomain.BUDDHISM_MEDITATION,
    title: 'Navayana Buddhism',
    tagline: 'Dr. Ambedkar\'s radical rereading of the Dhamma as liberation from oppression.',
    description: 'A structured study of Dr. B.R. Ambedkar\'s Navayana Buddhism — his philosophical reinterpretation of the Dhamma, the historical context of his conversion, and the living practice of Buddhism as social liberation in the Dalit community.',
    circleTag: 'Navayana',
    sortOrder: 8,
    phases: [
      {
        title: 'The Historical Context',
        lessons: [
          {
            title: 'The Caste System and the Need for Dhamma',
            duration: 12,
            overview: 'To understand why Dr. Ambedkar turned to Buddhism, you must first understand the system he was fighting. This lesson examines the caste system\'s theological foundations — how Brahminical Hinduism used scripture to justify hereditary oppression — and why Ambedkar concluded that spiritual liberation required a different religious foundation entirely.',
            concepts: ['The theological basis of caste in Manusmriti', 'Untouchability as a social and spiritual weapon', 'Why political reform alone was insufficient', 'Ambedkar\'s survey of world religions before conversion'],
            actionTask: 'Read the Preamble to the Indian Constitution (largely drafted by Ambedkar) and identify which principles directly counter caste ideology.',
            reflection: 'Why did Ambedkar believe that without changing religion, political equality would remain incomplete?',
          },
          {
            title: 'Ambedkar\'s Life and Intellectual Journey',
            duration: 11,
            overview: 'Dr. Bhimrao Ramji Ambedkar was one of the most educated people of his era — Columbia University, London School of Economics, Gray\'s Inn — and he used that intellectual formation to build a comprehensive case for the Dalit liberation. This lesson traces his life and the key moments that shaped his theology.',
            concepts: ['Ambedkar\'s academic formation and its influence on his thought', 'The Mahad Satyagraha (1927) — fighting for water rights as spiritual dignity', 'The burning of Manusmriti', 'Years of studying the Pali Canon before conversion'],
            actionTask: 'Read Chapter 1 of "Annihilation of Caste" (available freely online) and note Ambedkar\'s central argument.',
            reflection: 'What does it mean that one of modern India\'s greatest intellectuals concluded that caste could not be reformed from within Hinduism?',
          },
          {
            title: 'The Conversion at Nagpur — October 14, 1956',
            duration: 10,
            overview: 'On October 14, 1956, Dr. Ambedkar led approximately 600,000 Dalits in a mass conversion to Buddhism at Deekshabhoomi, Nagpur. This was not a religious event alone — it was a declaration of human dignity. This lesson explores the preparation, the ceremony, and its significance.',
            concepts: ['The 22 Vows (Baavis Pratiggya) — a rejection of Hinduism and an embrace of Dhamma', 'Why Buddhism rather than Christianity or Islam', 'The political and spiritual meaning of collective conversion', 'Ambedkar\'s death six weeks later — November 6, 1956'],
            actionTask: 'Read and memorize the 22 Vows taken at the Nagpur conversion. Reflect on each one.',
            reflection: 'Which of the 22 Vows strikes you as most radical, and which as most practically important?',
          },
        ],
      },
      {
        title: 'The Dhamma According to Ambedkar',
        lessons: [
          {
            title: 'The Buddha and His Dhamma — Core Themes',
            duration: 13,
            overview: 'In his magnum opus "The Buddha and His Dhamma" (published posthumously 1957), Ambedkar reinterpreted the Pali Canon through the lens of social liberation. This lesson explores the core argument: that the original Dhamma was a revolutionary teaching of equality, reason, and compassion — and that later additions distorted it.',
            concepts: ['Ambedkar\'s method: distinguishing original teachings from later additions', 'The Buddha\'s rejection of Vedic authority and the caste system', 'Dhamma as "right social order" not just personal liberation', 'Prajna and Karuna as the twin foundations'],
            actionTask: 'Read Part IV of "The Buddha and His Dhamma" — "What the Buddha Taught" — and compare it with a mainstream Buddhist summary of the Four Noble Truths.',
            reflection: 'How does reading the Dhamma through the lens of social justice change your understanding of what the Buddha was actually teaching?',
          },
          {
            title: 'Ambedkar\'s Critique of Traditional Buddhism',
            duration: 11,
            overview: 'Ambedkar did not simply adopt Buddhism — he critiqued and reconstructed it. He rejected karma as used to justify caste, the extreme asceticism of some traditions, and the idea that individual liberation was the final goal. This lesson explores his critiques and why they remain controversial and important.',
            concepts: ['Rejecting karma as fatalism (karma ≠ caste destiny)', 'The distinction between personal nibbana and collective liberation', 'Critique of Bhikkhu sangha that maintained caste hierarchy', 'Why Ambedkar emphasized rationality over ritual'],
            actionTask: 'Write a 200-word response: do you think Ambedkar\'s critique of traditional Buddhist karma doctrine is valid?',
            reflection: 'Can a teaching be deeply important and also misused? How do you hold that complexity?',
          },
          {
            title: 'The 22 Vows in Depth',
            duration: 10,
            overview: 'The 22 Vows taken at Nagpur are not merely a rejection of Hinduism — they are a positive commitment to a particular way of life rooted in reason, equality, and compassion. This lesson studies each vow\'s content, historical target, and ongoing relevance.',
            concepts: ['Vows 1–6: Renunciation of Hindu deities and their worship', 'Vows 7–10: Rejection of caste practices and Brahminical rites', 'Vows 11–16: Commitment to equality and the Brotherhood of Man', 'Vows 17–22: Embrace of the Dhamma, Sangha, and ethical life'],
            actionTask: 'Choose 3 of the 22 Vows that feel most personally meaningful. Write why and how you practice them.',
            reflection: 'Are these vows still radical today? Which ones face the greatest social resistance?',
          },
        ],
      },
      {
        title: 'Navayana in Practice',
        lessons: [
          {
            title: 'Meditation in the Navayana Tradition',
            duration: 11,
            overview: 'Navayana practice emphasizes meditation as a tool of mental clarity and ethical cultivation — not withdrawal from the world. This lesson covers the meditation practices that are common in Ambedkarite Buddhist communities, including Vipassana and Metta, understood through a liberation-focused lens.',
            concepts: ['Vipassana as investigation of the constructed self', 'Metta as social practice — extending lovingkindness to all beings equally', 'Mindfulness as preparation for engaged action', 'Differences between Goenka-tradition and Ambedkarite meditation practice'],
            actionTask: 'Practice 10 minutes of Metta meditation with a specific focus: extend lovingkindness to someone you consider an oppressor.',
            reflection: 'Does Metta practice change how you relate to those who have caused harm?',
          },
          {
            title: 'Panchsheel — The Five Precepts as Ethical Foundation',
            duration: 9,
            overview: 'The Five Precepts (Panchsheel) are the ethical bedrock of Navayana practice — not as commandments but as training principles. Ambedkar placed enormous emphasis on individual ethical transformation as the necessary complement to political action. This lesson studies each precept through an Ambedkarite lens.',
            concepts: ['Ahimsa: non-violence as an active principle (not passivity)', 'Satya: truth-speaking in a culture that suppresses Dalit voices', 'Asteya: not taking what is not given — including dignity', 'Brahmacharya: proper conduct in relationships', 'Sura-meraya: sobriety as liberation from false refuge'],
            actionTask: 'For one week, practice Right Speech (Satya) with specific attention to moments when social pressure pushes you toward silence.',
            reflection: 'Which precept is most difficult to maintain in your current social context, and why?',
          },
          {
            title: 'Engaged Buddhism — Social Action as Dhamma Practice',
            duration: 12,
            overview: 'For Ambedkarite Buddhists, practice is inseparable from social engagement. This lesson explores the tradition of engaged Buddhism in the Navayana lineage — from community organizing to education, from political advocacy to the Dalit literary movement — as expressions of Dhamma in action.',
            concepts: ['Dhamma as social ethics, not private spirituality', 'Education as liberation: Ambedkar\'s emphasis on "Educate, Agitate, Organize"', 'Buddhist organizations in social development (BVM, TBMSG)', 'The Dalit literary and cultural movement as Dhamma expression'],
            actionTask: 'Identify one social issue in your community that the Dhamma calls you to engage with. Write a 1-page plan for how you will act.',
            reflection: 'If the Dhamma is correct that all beings are equal in dignity, what does that require of you as a practitioner?',
          },
        ],
      },
      {
        title: 'Community and Legacy',
        lessons: [
          {
            title: 'Deekshabhoomi and Sacred Spaces of Navayana',
            duration: 9,
            overview: 'Navayana Buddhism has developed its own sacred geography — Deekshabhoomi in Nagpur, Chaityabhoomi in Mumbai, and many local vihara communities. This lesson explores these spaces and their role in sustaining communal identity and practice.',
            concepts: ['Deekshabhoomi: site of the 1956 conversion and annual pilgrimage', 'Chaityabhoomi: Ambedkar\'s memorial in Mumbai', 'The role of the local vihara in community life', 'Dhammachakra Pravartan Din — October 14 as the most important day in the Navayana calendar'],
            actionTask: 'If possible, visit or virtually explore Deekshabhoomi or another Ambedkarite Buddhist site. Document what you find.',
            reflection: 'Why do physical sacred spaces matter for a tradition that emphasizes reason over ritual?',
          },
          {
            title: 'Babasaheb\'s Intellectual Legacy',
            duration: 11,
            overview: 'Ambedkar left behind one of the most formidable intellectual legacies in modern world history — constitutional law, political theory, economics, and religious philosophy. This lesson surveys his key writings and their continued relevance.',
            concepts: ['Annihilation of Caste (1936): the most complete critique of caste ideology', 'Riddles in Hinduism: the theological dismantling of oppressive scripture', 'Pakistan or the Partition of India: political realism and minority rights', 'The Buddha and His Dhamma: the theological foundation of Navayana'],
            actionTask: 'Choose one Ambedkar text to read in full this month. Start with "Annihilation of Caste" if you haven\'t already.',
            reflection: 'What is the most important idea in Ambedkar\'s work that you believe is not widely known?',
          },
          {
            title: 'Living Navayana Today',
            duration: 12,
            overview: 'This final lesson asks what it means to practice Navayana Buddhism in the 21st century — to carry Babasaheb\'s vision forward in a world of social media, global inequality, and ongoing caste discrimination. It is an invitation to commitment, not conclusion.',
            concepts: ['Contemporary Navayana communities and movements globally', 'Carrying the conversion forward across generations', 'The relationship between Buddhism and Dalit identity in the diaspora', 'Dhamma as a living response to present-day conditions'],
            actionTask: 'Write your own commitment statement: what does it mean for you to be a Navayana Buddhist practitioner today?',
            reflection: 'What do you owe to those who came before? What do you owe to those who will come after?',
          },
        ],
      },
    ],
  },

  {
    slug: 'practical-meditation',
    domain: EducateDomain.BUDDHISM_MEDITATION,
    title: 'Practical Meditation',
    tagline: 'Build a sustainable meditation practice from the ground up.',
    description: 'A step-by-step introduction to meditation — covering breath awareness, body scan, loving-kindness, and insight practices — designed for complete beginners and those who have struggled to build a consistent practice.',
    circleTag: 'Meditation',
    sortOrder: 9,
    phases: [
      {
        title: 'Starting Out',
        lessons: [
          {
            title: 'What Meditation Actually Is',
            duration: 8,
            overview: 'Most people approach meditation with wrong expectations — hoping for relaxation, emptiness, or peak experiences. This lesson corrects those misconceptions and establishes an accurate, useful understanding of what meditation is and what it can do.',
            concepts: ['Meditation as attention training, not thought suppression', 'The difference between relaxation and meditation', 'Concentration (samatha) vs insight (vipassana)', 'Realistic expectations for a beginner'],
            actionTask: 'Sit quietly for 5 minutes. Don\'t try to meditate — just notice what happens.',
            reflection: 'What did you discover about your mind when you stopped feeding it new input?',
          },
          {
            title: 'Setting Up Your Practice',
            duration: 7,
            overview: 'Consistency matters more than duration in the early stages of meditation. This lesson covers the practical logistics — posture, environment, timing, and duration — that make practice sustainable rather than aspirational.',
            concepts: ['Posture options: cushion, chair, floor (comfort without collapse)', 'Environment: quiet, consistent, dedicated', 'Timing: morning practice vs other times', 'Starting with 10 minutes, not 60'],
            actionTask: 'Choose a specific time, place, and duration for your daily practice. Set it up today.',
            reflection: 'What has stopped you from establishing a consistent meditation practice in the past?',
          },
          {
            title: 'Your First 7 Days',
            duration: 9,
            overview: 'The first week of meditation is the most difficult — the mind rebels against the invitation to settle. This lesson prepares you for what you\'ll encounter and gives you the specific tools to work with the most common early obstacles.',
            concepts: ['Working with restlessness and boredom', 'When sleepiness arises', 'The "bad meditation" myth', 'How to measure progress when you can\'t see it'],
            actionTask: 'Meditate for 10 minutes on each of the next 7 days. Keep a one-sentence journal entry after each session.',
            reflection: 'Looking at your 7 entries — what patterns do you notice in when practice was easier vs harder?',
          },
        ],
      },
      {
        title: 'Breath Meditation',
        lessons: [
          {
            title: 'Following the Breath',
            duration: 10,
            overview: 'Breath meditation is the foundation of most Buddhist traditions because the breath is always present, never artificially added. This lesson teaches you exactly how to work with the breath — where to feel it, how to hold attention, and what to do when the mind wanders.',
            concepts: ['Finding your anchor point: nostrils, chest, or belly', 'The quality of attention (soft vs forced)', 'Counting as a training tool', 'The moment of noticing: the most important moment in meditation'],
            actionTask: 'Meditate for 15 minutes using breath as anchor. Count exhalations 1–10, then restart.',
            reflection: 'At what count did your mind most often wander? What was it wandering toward?',
          },
          {
            title: 'Working With a Wandering Mind',
            duration: 9,
            overview: 'The mind wandering is not a failure — it\'s the practice. This lesson teaches you to work skillfully with distraction: how to notice when you\'ve wandered, what to do about it, and how to use wandering itself as an object of investigation.',
            concepts: ['The gap between distraction and noticing', 'Labeling thoughts: "thinking, thinking"', 'The difference between a thought and getting lost in a thought', 'Distraction as useful information about your mental state'],
            actionTask: 'In your next 3 sessions, don\'t try to suppress wandering — instead, note where the mind goes each time.',
            reflection: 'What does the content of your mind\'s wandering reveal about what is occupying you?',
          },
          {
            title: 'Deepening Concentration',
            duration: 11,
            overview: 'As meditation practice matures, the quality of attention can deepen into states of genuine stillness (jhana). This lesson introduces the conditions for deepening concentration and what to do — and not do — when the mind begins to settle.',
            concepts: ['The five hindrances to concentration: desire, aversion, restlessness, sloth, doubt', 'Working with each hindrance specifically', 'Recognizing signs of deepening concentration', 'Not grasping after good states'],
            actionTask: 'Extend your sitting to 25 minutes. Notice if there are natural settling points in the session.',
            reflection: 'Which of the five hindrances is your most frequent companion in practice?',
          },
        ],
      },
      {
        title: 'Body and Emotion',
        lessons: [
          {
            title: 'Body Scan Practice',
            duration: 10,
            overview: 'The body is a rich field for meditation — dense with sensations that the thinking mind usually ignores or overrides. This lesson teaches systematic body scan practice as both a way to ground attention and to investigate the relationship between physical sensation and emotional state.',
            concepts: ['Moving attention systematically through the body', 'Sensations: pressure, warmth, tingling, vibration', 'The body-emotion connection', 'When to use body scan vs breath meditation'],
            actionTask: 'Do a 20-minute body scan from the feet upward. Note every sensation without preference.',
            reflection: 'Where in your body do you hold tension, and what does that tension correlate with emotionally?',
          },
          {
            title: 'Meditating With Difficult Emotions',
            duration: 12,
            overview: 'Emotions are the most challenging territory in meditation — and the most important. This lesson teaches you to bring anxious, angry, sad, or shameful emotions into the field of meditation rather than suppressing them or amplifying them.',
            concepts: ['RAIN practice: Recognize, Allow, Investigate, Nurture', 'The body signature of each major emotion', 'The difference between feeling an emotion and being it', 'When emotion in meditation indicates trauma and needs professional support'],
            actionTask: 'The next time a strong emotion arises, practice RAIN with it for 5 minutes before responding.',
            reflection: 'What happens to an emotion when you turn toward it with curiosity instead of resistance?',
          },
          {
            title: 'Walking Meditation',
            duration: 8,
            overview: 'Meditation doesn\'t require a cushion — the body in motion is as rich a field as the body at rest. This lesson teaches formal walking meditation as both a standalone practice and a bridge between sitting practice and mindful daily life.',
            concepts: ['Slow walking vs fast walking meditation', 'Anchor points in walking: contact, lifting, stepping', 'Using outdoor environments as part of the practice', 'Walking meditation as a transition between sitting periods'],
            actionTask: 'Practice 15 minutes of slow walking meditation, indoors or outdoors.',
            reflection: 'How does bringing attention to walking change your relationship to a normally automatic activity?',
          },
        ],
      },
      {
        title: 'Loving-Kindness (Metta)',
        lessons: [
          {
            title: 'What Is Metta?',
            duration: 9,
            overview: 'Metta — loving-kindness or goodwill — is a systematic cultivation of genuine care for all beings, starting with yourself. It is perhaps the most important practice in the entire Buddhist repertoire, and it is also widely misunderstood. This lesson establishes what Metta actually is and is not.',
            concepts: ['Metta vs sentiment vs attachment', 'The near enemy: possessive love', 'The far enemy: aversion', 'Why self-Metta is the necessary foundation'],
            actionTask: 'Sit for 10 minutes and simply repeat: "May I be well. May I be happy. May I be peaceful." Notice what arises.',
            reflection: 'What was your reaction to directing kindness toward yourself? Was it easy, difficult, hollow, or moving?',
          },
          {
            title: 'The Full Metta Practice',
            duration: 12,
            overview: 'Traditional Metta practice moves in concentric circles — from yourself, to loved ones, to neutral beings, to difficult beings, to all beings everywhere. This lesson guides you through the complete practice and explores why each circle matters.',
            concepts: ['Self → loved ones → neutral → difficult → all beings', 'Choosing your beneficiaries in each category', 'Working with the "difficult person" — the most important part', 'Physical sensations of genuine Metta arising'],
            actionTask: 'Do a complete 20-minute Metta sit. Spend 4 minutes on each circle.',
            reflection: 'At which circle did the practice feel most genuine? At which did it feel most forced?',
          },
          {
            title: 'Metta in Daily Life',
            duration: 8,
            overview: 'The purpose of formal Metta practice is to transform the quality of your moment-to-moment relationships. This lesson shows you how to carry Metta off the cushion — into difficult conversations, crowded commutes, and encounters with people you find challenging.',
            concepts: ['Silent Metta during daily encounters', 'Metta as a response to anger in real time', 'Metta for social groups and communities', 'The cumulative effect of Metta practice over months and years'],
            actionTask: 'This week, silently practice Metta for every person you speak with before and after the conversation.',
            reflection: 'How does holding a Metta intention change the quality of your attention during a conversation?',
          },
        ],
      },
      {
        title: 'Building a Lifetime Practice',
        lessons: [
          {
            title: 'Insight and Everyday Life',
            duration: 10,
            overview: 'The ultimate aim of meditation is not to feel good during a session — it\'s to change the quality of your awareness in everyday life. This lesson explores what informal mindfulness practice looks like and how to cultivate it throughout the day.',
            concepts: ['Formal vs informal practice', 'Mindful moments: washing, eating, walking, listening', 'The gap practice: pausing between stimulus and response', 'How formal practice trains informal mindfulness'],
            actionTask: 'Choose 3 everyday activities to do mindfully this week: eating one meal, one shower, one commute.',
            reflection: 'What do you notice differently when you bring full attention to an ordinary activity?',
          },
          {
            title: 'Retreat and Deepening',
            duration: 9,
            overview: 'Day-by-day practice builds the foundation; retreat deepens it. This lesson introduces the role of meditation retreats — from day-long sits to 10-day Vipassana courses — and how to approach one as a beginner.',
            concepts: ['What a meditation retreat involves', 'Preparing for your first retreat', 'Post-retreat integration — the most overlooked phase', 'Finding a teacher: what to look for and what to avoid'],
            actionTask: 'Research one meditation retreat within reach — a local day-sit or an introductory residential retreat.',
            reflection: 'What would you need to put in place to attend a retreat in the next 6 months?',
          },
          {
            title: 'Your Practice for Life',
            duration: 10,
            overview: 'Meditation is not a phase you pass through — it is a lifelong relationship with your own mind. This final lesson helps you design a sustainable, evolving practice that you will actually keep: one that serves your life rather than feeling like another obligation.',
            concepts: ['Designing a practice that fits your actual life', 'How practice changes across life stages', 'Working with long breaks and returning without judgment', 'The relationship between practice and community (Sangha)'],
            actionTask: 'Write your 1-year meditation practice plan: morning routine, retreat aspiration, and Sangha connection.',
            reflection: 'What kind of practitioner do you want to be in 5 years, and what does that require of you today?',
          },
        ],
      },
    ],
  },

  {
    slug: 'buddhist-wisdom',
    domain: EducateDomain.BUDDHISM_MEDITATION,
    title: 'Buddhist Wisdom',
    tagline: 'Ancient teachings. Practical tools for the modern mind.',
    description: 'A grounded introduction to Buddhist philosophy, meditation practice, and ethical living — accessible to practitioners of all traditions and to those approaching Buddhism for the first time.',
    circleTag: 'Dharma',
    sortOrder: 7,
    phases: [
      {
        title: 'Foundations of Dharma',
        lessons: [
          {
            title: 'The Four Noble Truths',
            duration: 10,
            overview: 'The Four Noble Truths are the foundation of Buddhist teaching — a precise diagnosis of suffering and a clear path toward its end. This lesson explores each truth not as a philosophical abstraction but as a direct description of lived experience.',
            concepts: ['Dukkha: the nature of suffering', 'Samudaya: the origin of suffering', 'Nirodha: the cessation of suffering', 'Magga: the path'],
            actionTask: 'Identify one source of recurring suffering in your life and trace it to its origin.',
            reflection: 'What would it mean to let go of the conditions that create this suffering?',
          },
          {
            title: 'The Eightfold Path',
            duration: 12,
            overview: 'The Eightfold Path is the Buddha\'s prescription for living wisely — covering how we see the world, how we speak and act, and how we train the mind. This lesson explores all eight factors and their relationships to each other.',
            concepts: ['Wisdom (Right View, Right Intention)', 'Ethics (Right Speech, Action, Livelihood)', 'Meditation (Right Effort, Mindfulness, Concentration)'],
            actionTask: 'Choose one factor of the Eightfold Path to practice consciously for one week.',
            reflection: 'How does this single practice change how you relate to others?',
          },
          {
            title: 'The Three Jewels',
            duration: 9,
            overview: 'Taking refuge in the Buddha, Dharma, and Sangha is the foundation of Buddhist practice. This lesson explores what each jewel means — not as ritual formality, but as a living orientation toward awakening.',
            concepts: ['Buddha: the awakened potential', 'Dharma: the teachings', 'Sangha: the community of practice'],
            actionTask: 'Write what each jewel means to you personally in your own words.',
            reflection: 'Which of the three jewels do you most neglect in your practice, and why?',
          },
        ],
      },
      {
        title: 'Meditation Practice',
        lessons: [
          {
            title: 'Beginning with the Breath',
            duration: 10,
            overview: 'Breath meditation is the entry point for most Buddhist practice traditions. This lesson establishes the foundations — posture, attention, and how to work with the inevitable wandering of the mind.',
            concepts: ['Anapanasati basics', 'Working with a wandering mind', 'Posture and environment'],
            actionTask: 'Meditate for 10 minutes daily for 7 consecutive days. Track what comes up.',
            reflection: 'What does your mind do when you stop giving it new input?',
          },
          {
            title: 'Loving-Kindness (Metta)',
            duration: 11,
            overview: 'Metta meditation systematically cultivates goodwill — first toward yourself, then outward to all beings. This lesson guides you through the practice and explores why it is both more challenging and more transformative than it first appears.',
            concepts: ['Metta for self, loved ones, neutrals, and difficult people', 'Heart-centered practice', 'Cultivating unconditional goodwill'],
            actionTask: 'Practice Metta for 10 minutes: begin with yourself, then extend outward.',
            reflection: 'Where did the resistance show up? Who was hardest to include in Metta?',
          },
          {
            title: 'Insight Meditation (Vipassana)',
            duration: 12,
            overview: 'Vipassana trains the mind to observe experience directly — to see the arising and passing of sensations, thoughts, and emotions without identification. This lesson introduces the practice and the liberation it points toward.',
            concepts: ['The three characteristics: anicca, dukkha, anatta', 'Body scan practice', 'Observing experience without identification'],
            actionTask: 'Do a 20-minute Vipassana sitting: observe sensations arising and passing without reaction.',
            reflection: 'What did you discover about the nature of your experience when you simply watched it?',
          },
        ],
      },
      {
        title: 'Buddhist Philosophy',
        lessons: [
          {
            title: 'Impermanence (Anicca)',
            duration: 9,
            overview: 'Everything that arises passes away — thoughts, feelings, relationships, bodies, civilizations. This lesson explores the teaching of impermanence not as a cause for despair, but as the doorway to genuine peace.',
            concepts: ['Everything arises and passes', 'Clinging as the source of suffering', 'Finding peace in impermanence'],
            actionTask: 'For one day, notice each time you resist change — in traffic, in relationships, in plans.',
            reflection: 'What would change in your life if you held things more lightly?',
          },
          {
            title: 'Non-Self (Anatta)',
            duration: 11,
            overview: 'The teaching of non-self is among the most challenging and liberating ideas in human thought. This lesson explores what it means that the "self" we take ourselves to be is a constructed process, not a fixed thing.',
            concepts: ['The five aggregates', 'The constructed self', 'Liberation through non-identification'],
            actionTask: 'Write about a belief you hold about "who you are." Then question its permanence.',
            reflection: 'If the self is not fixed, what becomes possible?',
          },
          {
            title: 'Dependent Origination',
            duration: 10,
            overview: 'Nothing exists in isolation — everything arises in dependence on causes and conditions. This lesson explores the 12 links of dependent origination and what they reveal about the mechanics of suffering and freedom.',
            concepts: ['All phenomena arise in dependence', 'The 12 links', 'Interrupting the chain of reactivity'],
            actionTask: 'Trace one negative emotion backward through the 12 links to its root condition.',
            reflection: 'At which link in the chain could you have intervened?',
          },
        ],
      },
      {
        title: 'Applied Buddhism',
        lessons: [
          {
            title: 'Right Livelihood in the Modern World',
            duration: 10,
            overview: 'The Buddha\'s teaching on right livelihood offers a profound ethical framework for thinking about work — one that goes far beyond career advice. This lesson explores how to align your professional life with your values.',
            concepts: ['Work that does not harm', 'Ethical business and consumption', 'Livelihood as practice'],
            actionTask: 'Evaluate your work against the Right Livelihood criteria. What would you change?',
            reflection: 'Is your livelihood in alignment with the values you hold?',
          },
          {
            title: 'Buddhism and Social Justice',
            duration: 11,
            overview: 'Buddhism has always had a social dimension — but the 20th century saw its most explicit development, from Dr. Ambedkar\'s Navayana movement to Thich Nhat Hanh\'s engaged Buddhism. This lesson explores this crucial tradition.',
            concepts: ['Dr. Ambedkar\'s Navayana Buddhism', 'Buddhism as liberation from oppression', 'Engaged Buddhism: Thich Nhat Hanh'],
            actionTask: 'Research one engaged Buddhist organization and its work.',
            reflection: 'How does your practice connect to the suffering of others beyond your immediate experience?',
          },
          {
            title: 'Daily Practice Design',
            duration: 9,
            overview: 'The Dharma only transforms your life if it meets you in the middle of ordinary moments — not just on the cushion. This lesson helps you design a daily practice that integrates formal meditation with mindful living.',
            concepts: ['Morning and evening practice', 'Mindfulness in action', 'Integrating Dharma into ordinary life'],
            actionTask: 'Design your personal daily Dharma practice: morning, day, and evening.',
            reflection: 'What is the one moment in your day where you most need the Dharma\'s support?',
          },
        ],
      },
      {
        title: 'Community Practice',
        lessons: [
          {
            title: 'The Importance of Sangha',
            duration: 9,
            overview: 'The Buddha identified community as one of the three jewels for a reason — practice in community offers something solo practice cannot. This lesson explores the unique gifts and challenges of the Sangha.',
            concepts: ['Practice in community vs alone', 'The Sangha as a mirror', 'Creating and sustaining communities of practice'],
            actionTask: 'Attend one Buddhist community event — online or in person — this week.',
            reflection: 'What does being in community offer that solo practice cannot?',
          },
          {
            title: 'Teaching and Sharing the Dharma',
            duration: 10,
            overview: 'Sharing what you understand deepens your own understanding — and creates ripples of benefit that extend far beyond the conversation. This lesson explores how to share the Dharma in a way that serves rather than imposes.',
            concepts: ['Sharing without preaching', 'Questions as Dharma', 'Being a Dharma friend'],
            actionTask: 'Teach one concept from this path to someone who has never encountered Buddhism.',
            reflection: 'What did teaching reveal about the gaps in your own understanding?',
          },
          {
            title: 'Living the Dharma',
            duration: 12,
            overview: 'This final lesson is an invitation to integrate everything you\'ve encountered — not as a set of beliefs to hold, but as a way of seeing and meeting the actual texture of your life.',
            concepts: ['Practice as a way of life', 'Moments of awakening in everyday experience', 'The ongoing journey'],
            actionTask: 'Write a personal Dharma statement: how you will live what you have learned.',
            reflection: 'What has changed in how you see yourself, others, and the world through this journey?',
          },
        ],
      },
    ],
  },
];

export async function seedEducatePaths(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  for (const path of PATHS) {
    try {
      await prisma.educatePath.upsert({
        where: { slug: path.slug },
        create: {
          slug: path.slug,
          domain: path.domain,
          title: path.title,
          tagline: path.tagline,
          description: path.description,
          circleTag: path.circleTag,
          sortOrder: path.sortOrder,
          phases: path.phases as unknown as object,
        },
        update: {
          title: path.title,
          tagline: path.tagline,
          description: path.description,
          circleTag: path.circleTag,
          sortOrder: path.sortOrder,
          phases: path.phases as unknown as object,
        },
      });
      seeded.push(path.slug);
    } catch (err) {
      console.error(`[SeedEducate] Failed: ${path.slug}`, err);
      failed.push(path.slug);
    }
  }

  return { seeded, failed, total: PATHS.length };
}
