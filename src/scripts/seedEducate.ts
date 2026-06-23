import { prisma } from '../config/database';
import { EducateDomain } from '@prisma/client';

interface LessonFrame {
  title: string;
  duration: number; // minutes
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
          { title: 'What AI Actually Is', duration: 8, concepts: ['Machine learning vs AI vs automation', 'How LLMs work', 'What AI can and cannot do'], actionTask: 'List 3 tasks in your business that are repetitive and rule-based.', reflection: 'Which of these tasks would free up the most time if AI handled them?' },
          { title: 'The AI Landscape Today', duration: 10, concepts: ['Categories: text, image, voice, code, video AI', 'Key tools: ChatGPT, Claude, Gemini, Midjourney', 'Open source vs proprietary models'], actionTask: 'Try one free AI tool for a real business task this week.', reflection: 'What surprised you about the tool\'s output?' },
          { title: 'AI Thinking Patterns', duration: 7, concepts: ['Probabilistic reasoning', 'Token prediction', 'Why AI hallucinates', 'Confidence calibration'], actionTask: 'Find one AI output that was incorrect and reason through why it happened.', reflection: 'How does understanding hallucination change how you\'ll use AI?' },
        ],
      },
      {
        title: 'Prompt Engineering',
        lessons: [
          { title: 'The Anatomy of a Good Prompt', duration: 10, concepts: ['Role, context, task, format', 'Zero-shot vs few-shot prompting', 'Chain-of-thought prompting'], actionTask: 'Rewrite a bad prompt you\'ve used before using the role-context-task-format structure.', reflection: 'What changed in the output quality?' },
          { title: 'Prompts for Business', duration: 12, concepts: ['Drafting emails, proposals, and SOPs', 'Extracting insights from documents', 'Generating structured data from unstructured text'], actionTask: 'Use AI to write your company\'s FAQ page from bullet notes.', reflection: 'Where did the AI add value? Where did it miss context only you know?' },
          { title: 'Prompt Systems and Templates', duration: 9, concepts: ['Building reusable prompt templates', 'Prompt versioning', 'Team prompt libraries'], actionTask: 'Create a prompt template for your most common business writing task.', reflection: 'How would your team benefit from a shared prompt library?' },
        ],
      },
      {
        title: 'Automation Systems',
        lessons: [
          { title: 'Mapping Your Automation Opportunities', duration: 10, concepts: ['The automation pyramid: data → logic → action', 'High-ROI vs low-ROI automation targets', 'Integration vs custom build'], actionTask: 'Draw your top 3 business workflows and mark which steps are automatable.', reflection: 'Which workflow, if automated, would have the highest business impact?' },
          { title: 'No-Code AI Tools', duration: 12, concepts: ['Make.com / Zapier for connecting apps', 'Notion AI for knowledge management', 'ChatGPT plugins and custom GPTs'], actionTask: 'Set up one simple automation (e.g., email → summary → Slack message).', reflection: 'What did this automation reveal about your existing workflow?' },
          { title: 'AI in Your Sales and Marketing', duration: 11, concepts: ['Lead scoring with AI', 'Personalized outreach at scale', 'Content generation pipelines'], actionTask: 'Use AI to write 5 personalized cold outreach messages from a prospect list.', reflection: 'How does AI-assisted personalization compare to manual effort?' },
        ],
      },
      {
        title: 'AI Agents',
        lessons: [
          { title: 'What Are AI Agents?', duration: 9, concepts: ['Agents vs chatbots', 'Tool use and memory', 'Multi-step reasoning'], actionTask: 'Research one AI agent framework (n8n, CrewAI, AutoGen) and document one use case.', reflection: 'What would you trust an agent to do autonomously in your business?' },
          { title: 'Building a Simple AI Agent', duration: 14, concepts: ['Defining agent goals and constraints', 'Tool calling basics', 'Human-in-the-loop checkpoints'], actionTask: 'Design (on paper) an agent that handles one routine business task end-to-end.', reflection: 'Where are the points where human judgment is irreplaceable?' },
          { title: 'Agent Safety and Oversight', duration: 8, concepts: ['Guardrails and approval flows', 'Logging and auditing agent actions', 'When agents fail'], actionTask: 'Write a one-page policy for how your business would deploy AI agents safely.', reflection: 'What is the cost of an agent making an autonomous mistake in your context?' },
        ],
      },
      {
        title: 'Business Applications',
        lessons: [
          { title: 'AI-Powered Decision Making', duration: 11, concepts: ['Data analysis with AI', 'Scenario planning', 'Reducing cognitive bias'], actionTask: 'Feed one business decision (past or current) into AI and compare its analysis to yours.', reflection: 'What did AI surface that you hadn\'t considered?' },
          { title: 'Building AI Into Your Team', duration: 10, concepts: ['AI adoption and change management', 'Training non-technical team members', 'Setting AI usage policies'], actionTask: 'Write a one-paragraph AI policy for your team\'s acceptable use.', reflection: 'What resistance do you anticipate, and how will you address it?' },
          { title: 'Your AI Roadmap', duration: 12, concepts: ['Prioritizing AI investments', '30-60-90 day implementation plan', 'Measuring AI ROI'], actionTask: 'Create your 90-day AI integration plan with 3 specific milestones.', reflection: 'What is the one AI change that would most transform your business this quarter?' },
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
          { title: 'The Entrepreneurial Mindset', duration: 9, concepts: ['Opportunity vs problem orientation', 'Risk tolerance and calculated bets', 'Long-term vs short-term thinking'], actionTask: 'Journal for 10 minutes on a problem you encounter every week that no one has solved well.', reflection: 'Is your attraction to entrepreneurship driven by opportunity or escape?' },
          { title: 'Understanding Your "Why"', duration: 8, concepts: ['Purpose-driven vs profit-driven ventures', 'Mission alignment', 'Sustainability of motivation'], actionTask: 'Write your founding story in 200 words as if telling it 5 years from now.', reflection: 'Is your "why" strong enough to sustain you through failure?' },
          { title: 'First Principles Thinking', duration: 10, concepts: ['Breaking assumptions', 'Reasoning from fundamentals', 'Avoiding cargo cult entrepreneurship'], actionTask: 'Take one industry assumption and challenge it with first principles reasoning.', reflection: 'What would you build if the current industry standard didn\'t exist?' },
        ],
      },
      {
        title: 'Idea Validation',
        lessons: [
          { title: 'The Problem First Principle', duration: 9, concepts: ['Pain points vs nice-to-haves', 'Market size estimation', 'Talking to customers before building'], actionTask: 'Conduct 5 customer discovery conversations about the problem you want to solve.', reflection: 'What surprised you most about what customers actually care about?' },
          { title: 'Competitive Analysis', duration: 10, concepts: ['Direct vs indirect competitors', 'Finding whitespace', 'Your unfair advantage'], actionTask: 'Map your competitive landscape on a 2x2 matrix (price vs quality).', reflection: 'Where on this map could you win with your current resources?' },
          { title: 'The Minimum Viable Test', duration: 11, concepts: ['MVP vs MLP', 'Smoke tests and landing pages', 'Measuring demand before building'], actionTask: 'Design a 1-week test to validate whether people will pay for your idea without building it.', reflection: 'What evidence would convince you this idea is worth 6 months of your life?' },
        ],
      },
      {
        title: 'Building & Launching',
        lessons: [
          { title: 'Building Fast Without Breaking Things', duration: 10, concepts: ['Lean startup principles', 'Build-measure-learn cycle', 'Technical debt decisions'], actionTask: 'Define the 3 core features of your product and the 10 things you will NOT build in v1.', reflection: 'What is the simplest version that would create real value for one customer?' },
          { title: 'Your First Sale', duration: 12, concepts: ['Manual before automated', 'Founder-led sales', 'Pricing your early offer'], actionTask: 'Make your first offer to a real potential customer — in person or over a call.', reflection: 'What objections came up, and what did they reveal about your product or pricing?' },
          { title: 'Launch Strategy', duration: 9, concepts: ['Soft launch vs public launch', 'Pre-launch community building', 'Launch channels that match your audience'], actionTask: 'Write your launch plan: channel, message, date, and one measurable goal.', reflection: 'Who are the 10 people who will become your earliest advocates, and how will you reach them?' },
        ],
      },
      {
        title: 'Growth',
        lessons: [
          { title: 'Product-Market Fit', duration: 11, concepts: ['The PMF feeling', 'Retention as the signal', 'When to scale vs when to pivot'], actionTask: 'Survey your current users: "How would you feel if you could no longer use this product?"', reflection: 'What would it take to reach 40% "very disappointed" responses?' },
          { title: 'Growth Channels', duration: 10, concepts: ['Paid vs organic vs viral growth', 'Channel-product fit', 'Unit economics'], actionTask: 'Run one small experiment in a growth channel you haven\'t tried.', reflection: 'What was your CAC, and is it sustainable?' },
          { title: 'Team and Culture', duration: 9, concepts: ['First hires', 'Culture as competitive advantage', 'When to hire vs when to build systems'], actionTask: 'Write the values of your company culture in 5 sentences.', reflection: 'Would your current team describe the culture the same way you just did?' },
        ],
      },
      {
        title: 'Scale & Impact',
        lessons: [
          { title: 'Systems Over Heroics', duration: 10, concepts: ['Processes and SOPs', 'Decision delegation', 'CEO vs operator mindset'], actionTask: 'Document one process that only you currently do so someone else could do it.', reflection: 'What would you do with the time you get back if this was no longer your job?' },
          { title: 'Impact Measurement', duration: 9, concepts: ['Social return on investment', 'Stakeholder value beyond shareholders', 'Purpose and profit alignment'], actionTask: 'Define 3 non-financial metrics that measure your company\'s impact.', reflection: 'Are you building a business that you\'d be proud of in 20 years?' },
          { title: 'Your Entrepreneurial Legacy', duration: 11, concepts: ['Exit options and succession', 'Building to last', 'Giving back to the ecosystem'], actionTask: 'Write a one-page vision for what your company looks like in 10 years.', reflection: 'What would need to be true about you as a leader for that vision to become real?' },
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
          { title: 'The Truth About Sales', duration: 8, concepts: ['Helping vs persuading', 'Value creation vs extraction', 'Trust as the foundation of sales'], actionTask: 'Recall your best buying experience. What made the seller trustworthy?', reflection: 'What does your current sales approach say about how you view your customers?' },
          { title: 'Understanding Buyer Psychology', duration: 10, concepts: ['Emotional vs rational decisions', 'The job-to-be-done framework', 'Loss aversion in buying'], actionTask: 'Map the emotional journey your ideal customer goes through before buying.', reflection: 'At which point in the journey does your current approach show up?' },
          { title: 'Your Sales Process', duration: 9, concepts: ['Stages: awareness → interest → decision → action', 'Conversion rates at each stage', 'Diagnosing where you\'re losing deals'], actionTask: 'Draw your current sales process and mark the stage where most deals fall out.', reflection: 'What is the underlying reason deals fall out at that stage?' },
        ],
      },
      {
        title: 'Prospecting & Outreach',
        lessons: [
          { title: 'Defining Your Ideal Client', duration: 9, concepts: ['ICP: industry, size, role, pain point', 'Negative personas', 'Lifetime value estimation'], actionTask: 'Write your ideal client profile in one detailed paragraph.', reflection: 'How close is your current client base to this profile?' },
          { title: 'Outreach That Works', duration: 11, concepts: ['Personalization at scale', 'Subject lines and opening sentences', 'Multi-touch sequences'], actionTask: 'Write 3 outreach messages to 3 different prospects using the research-value-ask structure.', reflection: 'What would make you respond to this message if you received it?' },
          { title: 'The Discovery Call', duration: 12, concepts: ['SPIN and MEDDIC frameworks', 'Active listening skills', 'Uncovering the real problem'], actionTask: 'Record yourself on a mock discovery call and review for talking vs listening ratio.', reflection: 'What questions could you ask that would make prospects feel truly heard?' },
        ],
      },
      {
        title: 'Closing & Negotiation',
        lessons: [
          { title: 'Presenting Solutions', duration: 10, concepts: ['Tailoring the demo to the discovery', 'Before-and-after framing', 'Making the ROI tangible'], actionTask: 'Rewrite your standard pitch as a story about a specific customer\'s transformation.', reflection: 'Does your pitch talk more about your product or about the customer\'s future?' },
          { title: 'Handling Objections', duration: 11, concepts: ['Price, timing, need, trust objections', 'Acknowledge-ask-address framework', 'The objection behind the objection'], actionTask: 'List your top 5 objections and write a response that addresses the emotion first.', reflection: 'Which objection are you most uncomfortable hearing, and why?' },
          { title: 'Closing Techniques That Respect Buyers', duration: 9, concepts: ['Assumptive vs consultative close', 'Trial closes', 'Creating urgency without pressure'], actionTask: 'Role-play the closing conversation of a recent lost deal with a colleague.', reflection: 'At what point in the conversation did you lose momentum, and what could you have done differently?' },
        ],
      },
      {
        title: 'Retention & Growth',
        lessons: [
          { title: 'The Onboarding That Sells Again', duration: 9, concepts: ['First 90 days as a sales moment', 'Success milestones', 'Expansion signals'], actionTask: 'Map your current client onboarding and identify where clients go quiet.', reflection: 'What would you want a client to say about your onboarding to a friend?' },
          { title: 'Referral Systems', duration: 10, concepts: ['Timing the ask', 'Making referrals easy', 'Building a referral culture'], actionTask: 'Identify your 5 happiest clients and design a referral conversation for each.', reflection: 'Why haven\'t you asked these clients for a referral yet?' },
          { title: 'Building a Sales System', duration: 11, concepts: ['CRM habits', 'Pipeline reviews', 'Sales metrics that matter'], actionTask: 'Set up a simple weekly sales review ritual: pipeline, next actions, blockers.', reflection: 'What one metric, if improved by 20%, would most impact your revenue?' },
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
          { title: 'The Leader You Are Today', duration: 9, concepts: ['Self-awareness as foundation', 'Leadership styles and their contexts', 'Identifying your default patterns'], actionTask: 'Ask 3 people who work with you: "What is it like to be led by me?"', reflection: 'How close is their answer to how you see yourself?' },
          { title: 'Managing Your Energy', duration: 8, concepts: ['Decision fatigue', 'Peak performance rhythms', 'Emotional regulation under pressure'], actionTask: 'Track your energy levels hourly for 3 days and identify your high-performance windows.', reflection: 'Are your most important decisions being made in your high-energy windows?' },
          { title: 'The Courage to Lead', duration: 10, concepts: ['Vulnerability as strength', 'Hard conversations', 'Leading through uncertainty'], actionTask: 'Have one conversation you have been avoiding for more than 2 weeks.', reflection: 'What did the conversation reveal about your relationship with conflict?' },
        ],
      },
      {
        title: 'Team Leadership',
        lessons: [
          { title: 'Building Psychological Safety', duration: 10, concepts: ['Google\'s Project Aristotle findings', 'Creating space for dissent', 'Trust vs comfort'], actionTask: 'At your next team meeting, ask the group: "What is something we should be doing differently?"', reflection: 'What does the quality of the responses tell you about psychological safety on your team?' },
          { title: 'Delegation and Accountability', duration: 11, concepts: ['The delegation ladder', 'Clear expectations vs micromanagement', 'Accountability without blame'], actionTask: 'Choose one task you own that someone on your team should own instead. Delegate it this week.', reflection: 'What does your reluctance to delegate reveal about you?' },
          { title: 'Feedback as a Leadership Tool', duration: 9, concepts: ['SBI model: Situation-Behavior-Impact', 'Radical candor', 'Creating a feedback culture'], actionTask: 'Give one piece of specific, actionable, kind feedback to a team member today.', reflection: 'What stopped you from giving this feedback earlier?' },
        ],
      },
      {
        title: 'Strategic Leadership',
        lessons: [
          { title: 'Thinking in Systems', duration: 10, concepts: ['First-order vs second-order effects', 'Leverage points', 'Long-game decision making'], actionTask: 'Map the second-order effects of a decision you made in the last 6 months.', reflection: 'What would you have decided differently if you had thought two steps ahead?' },
          { title: 'Communicating Vision', duration: 9, concepts: ['Making the abstract concrete', 'Storytelling for strategy', 'Repeated, consistent messaging'], actionTask: 'Write your team\'s vision as a one-paragraph story set 3 years in the future.', reflection: 'Could your team recite the core of this vision without reading it?' },
          { title: 'Leading Through Change', duration: 11, concepts: ['Change resistance patterns', 'The change curve', 'Coalition building'], actionTask: 'Identify who on your team is most resistant to a current change, and schedule a 1:1 with them.', reflection: 'What legitimate concerns might their resistance be hiding?' },
        ],
      },
      {
        title: 'Legacy Leadership',
        lessons: [
          { title: 'Growing Leaders Around You', duration: 10, concepts: ['Multiplier vs diminisher leaders', 'Mentorship vs sponsorship', 'Creating leadership pipelines'], actionTask: 'Identify one person on your team you could deliberately develop into a leader. Make a plan.', reflection: 'What would your organization look like if everyone you led became a leader too?' },
          { title: 'Ethical Leadership', duration: 9, concepts: ['Values under pressure', 'Power and accountability', 'Leading with integrity over convenience'], actionTask: 'Write your personal leadership manifesto: 5 principles you will never compromise.', reflection: 'Have you ever compromised one of these principles? What were the consequences?' },
          { title: 'Your Leadership Legacy', duration: 11, concepts: ['How leaders are remembered', 'Impact beyond the org chart', 'Leadership as service'], actionTask: 'Write your leadership eulogy: what would your team say about working with you?', reflection: 'What would you need to change today for that eulogy to be true?' },
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
          { title: 'Redefining Networking', duration: 8, concepts: ['Generosity vs extraction', 'Weak ties and strong ties', 'Network quality vs quantity'], actionTask: 'Identify 3 people in your network you have given the most to. Have you maintained these relationships?', reflection: 'What does your networking approach say about your underlying values?' },
          { title: 'Mapping Your Current Network', duration: 9, concepts: ['Network visualization', 'Identifying gaps by domain and geography', 'Diversity of thought in your network'], actionTask: 'Draw your network map: who are your top 20 relationships and how are they connected?', reflection: 'What does the shape of your current network tell you about who you spend time with?' },
          { title: 'The Long Game', duration: 8, concepts: ['Compounding relationships', 'Reputation as infrastructure', 'Playing infinite vs finite games'], actionTask: 'Identify one relationship you let fade. Reach out today with no agenda.', reflection: 'Why did you stop maintaining this relationship, and what did you lose as a result?' },
        ],
      },
      {
        title: 'Building Connections',
        lessons: [
          { title: 'The Art of the Introduction', duration: 9, concepts: ['Research before reaching out', 'Opening with value not ask', 'The 5-sentence outreach formula'], actionTask: 'Write an outreach message to someone you admire, offering something of value with no ask.', reflection: 'What would you want someone to say when they first reach out to you?' },
          { title: 'Making Events Count', duration: 10, concepts: ['Quality over quantity at events', 'Deep vs shallow conversations', 'Following up while memory is fresh'], actionTask: 'At your next event, commit to 3 deep conversations instead of 20 business card exchanges.', reflection: 'What made those 3 conversations meaningful or unmemorable?' },
          { title: 'Building in Community', duration: 9, concepts: ['Contributing to shared spaces', 'Being known for something specific', 'Generosity that creates gravity'], actionTask: 'Choose one community and commit to contributing value every week for the next month.', reflection: 'What is the one thing you want people in your community to associate with your name?' },
        ],
      },
      {
        title: 'Maintaining Relationships',
        lessons: [
          { title: 'Systems for Staying in Touch', duration: 8, concepts: ['The give-give-ask rhythm', 'CRM for relationships', 'Thoughtful vs automated follow-ups'], actionTask: 'Set up a simple system to follow up with 5 key contacts each week without it feeling mechanical.', reflection: 'What would the people you want to stay close to say about how you show up for them?' },
          { title: 'Being the Connector', duration: 10, concepts: ['Super-connector positioning', 'Making the right introduction', 'Creating network effects for others'], actionTask: 'Make one introduction between two people in your network who should know each other.', reflection: 'What stopped you from making this introduction sooner?' },
          { title: 'Navigating Difficult Relationships', duration: 9, concepts: ['Setting relationship boundaries', 'Ending transactional relationships gracefully', 'Repairing trust'], actionTask: 'Identify one relationship in your network that is draining. Decide: invest or gracefully exit.', reflection: 'Are there relationships you maintain out of obligation rather than mutual value?' },
        ],
      },
      {
        title: 'Network Effects',
        lessons: [
          { title: 'Building Your Reputation Online', duration: 10, concepts: ['Content as networking', 'Consistency of message', 'Intellectual generosity'], actionTask: 'Write one piece of content that teaches something useful to your target network.', reflection: 'What knowledge do you have that others in your field would genuinely value?' },
          { title: 'Leveraging Your Network for Opportunities', duration: 11, concepts: ['Asking well', 'Making asks easy to fulfill', 'Timing the ask'], actionTask: 'Identify one specific opportunity you need. Map which contact in your network is closest to it.', reflection: 'What have you given this person that makes your ask reasonable?' },
          { title: 'Your Network as a Legacy', duration: 9, concepts: ['Network stewardship', 'Paying it forward', 'Creating community from your network'], actionTask: 'Host a small gathering of 8-10 people from your network who would benefit from knowing each other.', reflection: 'What community could you create that didn\'t exist before you?' },
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
          { title: 'Your Money Story', duration: 8, concepts: ['Childhood money beliefs', 'Scarcity vs abundance mindset', 'Emotional triggers around money'], actionTask: 'Write about your first money memory and what belief it created.', reflection: 'How does that belief show up in your financial decisions today?' },
          { title: 'What Wealth Actually Is', duration: 9, concepts: ['Time freedom vs money accumulation', 'Net worth vs income', 'Assets vs liabilities'], actionTask: 'Calculate your net worth today: assets minus liabilities.', reflection: 'Is your current financial behavior moving this number in the right direction?' },
          { title: 'The Cost of Financial Avoidance', duration: 8, concepts: ['Financial anxiety patterns', 'The compounding cost of delay', 'Clarity as the antidote to anxiety'], actionTask: 'Spend 30 minutes reviewing your last 3 months of spending with no judgment.', reflection: 'What pattern did you see that you had been avoiding looking at?' },
        ],
      },
      {
        title: 'Saving & Investing',
        lessons: [
          { title: 'The Foundation: Emergency Fund', duration: 9, concepts: ['6-month expense cushion', 'Liquid vs invested savings', 'Automating savings before spending'], actionTask: 'Calculate what 6 months of expenses looks like for you. Set an automatic transfer today.', reflection: 'What would financial security feel like in your body if you had 6 months of expenses saved?' },
          { title: 'Investing Basics', duration: 12, concepts: ['Compounding over time', 'Index funds vs active funds', 'Asset allocation basics (equity, debt, gold)'], actionTask: 'Open or review your investment account and check your asset allocation.', reflection: 'Does your current allocation match your actual risk tolerance or what you think it should be?' },
          { title: 'Tax-Efficient Wealth Building', duration: 10, concepts: ['Tax-advantaged accounts (PPF, NPS, ELSS)', 'Tax-loss harvesting', 'Long-term capital gains planning'], actionTask: 'Identify which tax-saving instruments you are underutilizing and calculate the opportunity cost.', reflection: 'How much money are you losing each year to taxes that could be legally reduced?' },
        ],
      },
      {
        title: 'Multiple Income Streams',
        lessons: [
          { title: 'The One-Income Risk', duration: 8, concepts: ['Income concentration risk', 'Active vs passive income', 'The income diversification ladder'], actionTask: 'List all your current income sources and their percentage of your total income.', reflection: 'If your primary income disappeared tomorrow, how long could you survive?' },
          { title: 'Building a Second Income', duration: 11, concepts: ['Skills monetization', 'Digital products and content', 'Consulting and freelancing'], actionTask: 'Identify one skill you have that someone would pay for. Research what they would pay.', reflection: 'What is stopping you from charging for this skill today?' },
          { title: 'Passive Income Realities', duration: 10, concepts: ['The myth of truly passive income', 'Rental income, dividends, and royalties', 'Upfront work for future cash flow'], actionTask: 'Research one passive income model that matches your skills and capital.', reflection: 'What is the real time and money investment required before this income becomes "passive"?' },
        ],
      },
      {
        title: 'Wealth Protection',
        lessons: [
          { title: 'Insurance as Wealth Protection', duration: 9, concepts: ['Term life insurance fundamentals', 'Health insurance gaps', 'What to insure vs what to self-insure'], actionTask: 'Review your current insurance coverage and identify any protection gaps.', reflection: 'Is your family financially protected if something happened to you tomorrow?' },
          { title: 'Estate Basics', duration: 8, concepts: ['Will vs trust', 'Nominee vs legal heir', 'Digital asset planning'], actionTask: 'Write a simple list of your assets, liabilities, and who should receive what.', reflection: 'Would your family know what to do with your finances if they needed to tomorrow?' },
          { title: 'Your 10-Year Financial Plan', duration: 12, concepts: ['Goal-based financial planning', 'Inflation-adjusted targets', 'Annual financial review habit'], actionTask: 'Write your 10-year financial goals and the monthly savings required to reach each one.', reflection: 'What is the gap between your current savings rate and what your goals require?' },
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
          { title: 'The Four Noble Truths', duration: 10, concepts: ['Dukkha: the nature of suffering', 'Samudaya: the origin of suffering', 'Nirodha: the cessation of suffering', 'Magga: the path'], actionTask: 'Identify one source of recurring suffering in your life and trace it to its origin.', reflection: 'What would it mean to let go of the conditions that create this suffering?' },
          { title: 'The Eightfold Path', duration: 12, concepts: ['Wisdom (Right View, Right Intention)', 'Ethics (Right Speech, Action, Livelihood)', 'Meditation (Right Effort, Mindfulness, Concentration)'], actionTask: 'Choose one factor of the Eightfold Path to practice consciously for one week.', reflection: 'How does this single practice change how you relate to others?' },
          { title: 'The Three Jewels', duration: 9, concepts: ['Buddha: the awakened potential', 'Dharma: the teachings', 'Sangha: the community of practice'], actionTask: 'Write what each jewel means to you personally in your own words.', reflection: 'Which of the three jewels do you most neglect in your practice, and why?' },
        ],
      },
      {
        title: 'Meditation Practice',
        lessons: [
          { title: 'Beginning with the Breath', duration: 10, concepts: ['Anapanasati basics', 'Working with a wandering mind', 'Posture and environment'], actionTask: 'Meditate for 10 minutes daily for 7 consecutive days. Track what comes up.', reflection: 'What does your mind do when you stop giving it new input?' },
          { title: 'Loving-Kindness (Metta)', duration: 11, concepts: ['Metta for self, loved ones, neutrals, and difficult people', 'Heart-centered practice', 'Cultivating unconditional goodwill'], actionTask: 'Practice Metta for 10 minutes: begin with yourself, then extend outward.', reflection: 'Where did the resistance show up? Who was hardest to include in Metta?' },
          { title: 'Insight Meditation (Vipassana)', duration: 12, concepts: ['The three characteristics: anicca, dukkha, anatta', 'Body scan practice', 'Observing experience without identification'], actionTask: 'Do a 20-minute Vipassana sitting: observe sensations arising and passing without reaction.', reflection: 'What did you discover about the nature of your experience when you simply watched it?' },
        ],
      },
      {
        title: 'Buddhist Philosophy',
        lessons: [
          { title: 'Impermanence (Anicca)', duration: 9, concepts: ['Everything arises and passes', 'Clinging as the source of suffering', 'Finding peace in impermanence'], actionTask: 'For one day, notice each time you resist change — in traffic, in relationships, in plans.', reflection: 'What would change in your life if you held things more lightly?' },
          { title: 'Non-Self (Anatta)', duration: 11, concepts: ['The five aggregates', 'The constructed self', 'Liberation through non-identification'], actionTask: 'Write about a belief you hold about "who you are." Then question its permanence.', reflection: 'If the self is not fixed, what becomes possible?' },
          { title: 'Dependent Origination', duration: 10, concepts: ['All phenomena arise in dependence', 'The 12 links', 'Interrupting the chain of reactivity'], actionTask: 'Trace one negative emotion backward through the 12 links to its root condition.', reflection: 'At which link in the chain could you have intervened?' },
        ],
      },
      {
        title: 'Applied Buddhism',
        lessons: [
          { title: 'Right Livelihood in the Modern World', duration: 10, concepts: ['Work that does not harm', 'Ethical business and consumption', 'Livelihood as practice'], actionTask: 'Evaluate your work against the Right Livelihood criteria. What would you change?', reflection: 'Is your livelihood in alignment with the values you hold?' },
          { title: 'Buddhism and Social Justice', duration: 11, concepts: ['Dr. Ambedkar\'s Navayana Buddhism', 'Buddhism as liberation from oppression', 'Engaged Buddhism: Thich Nhat Hanh'], actionTask: 'Research one engaged Buddhist organization and its work.', reflection: 'How does your practice connect to the suffering of others beyond your immediate experience?' },
          { title: 'Daily Practice Design', duration: 9, concepts: ['Morning and evening practice', 'Mindfulness in action', 'Integrating Dharma into ordinary life'], actionTask: 'Design your personal daily Dharma practice: morning, day, and evening.', reflection: 'What is the one moment in your day where you most need the Dharma\'s support?' },
        ],
      },
      {
        title: 'Community Practice',
        lessons: [
          { title: 'The Importance of Sangha', duration: 9, concepts: ['Practice in community vs alone', 'The Sangha as a mirror', 'Creating and sustaining communities of practice'], actionTask: 'Attend one Buddhist community event — online or in person — this week.', reflection: 'What does being in community offer that solo practice cannot?' },
          { title: 'Teaching and Sharing the Dharma', duration: 10, concepts: ['Sharing without preaching', 'Questions as Dharma', 'Being a Dharma friend'], actionTask: 'Teach one concept from this path to someone who has never encountered Buddhism.', reflection: 'What did teaching reveal about the gaps in your own understanding?' },
          { title: 'Living the Dharma', duration: 12, concepts: ['Practice as a way of life', 'Moments of awakening in everyday experience', 'The ongoing journey'], actionTask: 'Write a personal Dharma statement: how you will live what you have learned.', reflection: 'What has changed in how you see yourself, others, and the world through this journey?' },
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
