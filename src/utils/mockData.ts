import { Message, FeedbackData } from '../context/InterviewContext';

// Interview questions
const interviewQuestions = [
  "Tell me about yourself and your experience.",
  "Why are you interested in this position?",
  "What are your greatest strengths and weaknesses?",
  "Describe a challenging situation at work and how you handled it.",
  "Where do you see yourself in five years?",
  "Why should we hire you?",
  "What questions do you have for me?"
];

export const getMockAIMessage = (): string => {
  // Randomly select a question
  const randomIndex = Math.floor(Math.random() * interviewQuestions.length);
  return interviewQuestions[randomIndex];
};

export const getMockFeedback = (messages: Message[]): FeedbackData => {
  return {
    overallScore: 4.2,
    englishScore: {
      pronunciation: 4.2,
      vocabulary: 3.8,
      grammar: 4.1
    },
    interviewScore: {
      structure: 4.0,
      logic: 4.3,
      softSkills: 4.5
    },
    strengths: [
      "専門用語を適切に使用し、業界知識の深さを示せています",
      "具体的な数値や実績を交えた説得力のある回答ができています",
      "質問の意図を正確に理解し、的確な応答ができています"
    ],
    improvements: [
      "長文での文法的な正確性にやや課題があります",
      "抽象的な表現が多く、より具体的な例示が必要です",
      "音の連結やイントネーションの自然さに改善の余地があります"
    ],
    nextSteps: [
      "STAR法を意識した回答の構造化を練習しましょう",
      "音声を録音して発音やイントネーションを確認しましょう",
      "業界特有の表現や専門用語の使用例を学習しましょう"
    ],
    detailedFeedback: messages.reduce((acc: any[], message, index) => {
      if (message.role === 'ai') {
        const userResponse = messages[index + 1];
        if (userResponse && userResponse.role === 'user') {
          acc.push({
            questionId: message.id,
            question: message.content,
            answer: userResponse.content,
            englishFeedback: getEnglishFeedback(acc.length),
            interviewFeedback: getInterviewFeedback(acc.length),
            idealAnswer: getRandomIdealAnswer(message.content)
          });
        }
      }
      return acc;
    }, [])
  };
};

function getEnglishFeedback(index: number): string {
  const feedbacks = [
    "発音は全体的に明瞭で聞き取りやすく、特に重要な専門用語の発音が正確です。文法面では現在完了形の使用が適切で、時制の一貫性が保たれています。ただし、関係詞を使用した複文でのつながりに若干の不自然さが見られました。",
    "語彙の選択が適切で、特にビジネスシーンで使用される表現を効果的に取り入れています。一方で、音の連結や強勢の置き方に改善の余地があり、より自然な英語らしさを出すことができます。",
    "文法的な正確性が高く、特に条件文や仮定法の使用が適切です。ただし、長文になると文構造が複雑になりすぎる傾向があり、よりシンプルな表現で伝えることを意識するとよいでしょう。"
  ];
  
  return feedbacks[index % feedbacks.length];
}

function getInterviewFeedback(index: number): string {
  const feedbacks = [
    "回答の構造が明確で、特に具体的な成果を数値で示せている点が効果的です。ただし、その経験から得た学びや成長についての言及がもう少しあると、より説得力が増すでしょう。",
    "質問の意図を正確に理解し、関連する経験を適切に結び付けて説明できています。チームでの役割や他者との協働について、もう少し具体的な例示があるとさらに良くなります。",
    "論理的な展開で説得力のある回答ができています。特に、課題解決のプロセスを段階的に説明できている点が評価できます。今後は、より簡潔な表現で要点を伝える練習をすると良いでしょう。"
  ];
  
  return feedbacks[index % feedbacks.length];
}

const getRandomIdealAnswer = (question: string): string => {
  const answerMap: Record<string, string> = {
    "Tell me about yourself and your experience.": 
      "I have been working as a software engineer for 5 years, specializing in full-stack web development. At my current company, I've led the development of our core e-commerce platform, which increased sales by 40% year-over-year. I'm particularly skilled in React and Node.js, and I have a track record of mentoring junior developers. I'm now looking for opportunities to take on more architectural responsibilities while continuing to grow as a technical leader.",
    
    "Why are you interested in this position?": 
      "I'm particularly drawn to this position because it aligns perfectly with my experience in cloud architecture and my passion for fintech innovation. I've been following your company's groundbreaking work in blockchain integration, and I'm impressed by your recent launch of the distributed ledger platform. My experience building secure, scalable payment systems at my current company has given me insights that I believe would be valuable in helping achieve your team's ambitious goals.",
    
    "What are your greatest strengths and weaknesses?": 
      "One of my key strengths is my analytical approach to problem-solving. For example, when our team faced a critical performance issue affecting 10,000 users, I systematically analyzed the system bottlenecks and implemented a caching solution that reduced response times by 70%. As for areas of improvement, I've recognized that I sometimes focus too much on perfecting technical details. To address this, I've implemented agile methodologies and set clear MVP criteria for projects, which has helped me maintain a better balance between perfection and productivity.",
    
    "Describe a challenging situation at work and how you handled it.":
      "Last year, we faced a critical situation when we discovered a security vulnerability in our payment system just 48 hours before a major release. I immediately assembled a response team and established a war room. First, I conducted a thorough risk assessment and identified the most critical areas needing immediate attention. Then, I divided the team into three groups: one focusing on the fix, another on testing, and the third on stakeholder communication. We worked through the night, implementing and testing a solution that not only addressed the immediate vulnerability but also strengthened our overall security architecture. Through transparent communication with stakeholders and efficient coordination, we managed to deploy the fix and launch with just a 24-hour delay, maintaining both our security standards and client trust.",
    
    "Where do you see yourself in five years?":
      "In five years, I envision myself having grown into a technical architect role, leading a team that drives innovation in cloud-native solutions. I plan to deepen my expertise in distributed systems and contribute to open-source projects in this space. I'm also committed to mentoring the next generation of developers, as I believe knowledge sharing is crucial for both personal growth and team success. I see myself taking on more strategic responsibilities, possibly leading the technical direction of major initiatives while continuing to stay hands-on with emerging technologies."
  };
  
  return answerMap[question] || 
    "I would approach this question by first analyzing the key requirements and then connecting them to my relevant experiences. I believe in providing concrete examples with quantifiable results whenever possible, and I always ensure my responses demonstrate both my technical capabilities and my understanding of business value.";
};