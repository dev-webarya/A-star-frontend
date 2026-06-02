import React, { useState, useEffect } from 'react';
import QuestionList, { Question as UIQuestion } from '../components/QuestionList';
import QuestionModal from '../components/QuestionModal';
import { getQuestions, getQuestionById } from '../api/api/questionApi';
import { getApprovedAnswersByQuestion } from '../api/api/answerApi';
import toast from 'react-hot-toast';

// Transform API question to UI question
const transformQuestion = (q: any): UIQuestion => ({
  id: q.id,
  title: q.title,
  equation: '', // Equation might be in descriptionHtml
  description: q.descriptionHtml?.replace(/<[^>]*>/g, '').slice(0, 100) + '...' || '',
  isClosed: false, // We'll determine this by checking answers
  attempts: 0,
});

const MathQA: React.FC = () => {
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [questions, setQuestions] = useState<UIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UIQuestion | null>(null);
  const [selectedFull, setSelectedFull] = useState<any | null>(null);
  const [solutions, setSolutions] = useState<{ [id: string]: { user: string; latex: string }[] }>({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions({ page: 0, size: 50, sort: 'createdAt', direction: 'desc' });
      const apiQuestions = data.content || [];
      
      // For each question, we might want to know if it's closed
      // But for now let's just transform them
      const transformed = apiQuestions.map(transformQuestion);
      
      // In a real app, we'd fetch answer status in bulk or as needed
      setQuestions(transformed);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (q: UIQuestion) => {
    setSelected(q);
    try {
      const fullQuestion = await getQuestionById(q.id);
      setSelectedFull(fullQuestion);
      
      // Fetch solutions/answers
      const answers = await getApprovedAnswersByQuestion(q.id);
      setSolutions(prev => ({
        ...prev,
        [q.id]: answers.map((a: any) => ({ user: a.authorName, latex: a.contentHtml }))
      }));
    } catch (error) {
      console.error('Error fetching question details:', error);
    }
  };
  const handleCloseModal = () => setSelected(null);
  const handleSubmitSolution = async (latex: string) => {
    if (!selected) return;
    try {
      const { submitAnswer } = await import('../api/api/answerApi');
      await submitAnswer({ questionId: selected.id, contentHtml: latex });
      toast.success('Answer submitted for review!');
      
      // Update local state if needed
      setSolutions(prev => ({
        ...prev,
        [selected.id]: [...(prev[selected.id] || []), { user: 'You', latex }],
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit answer');
    }
  };

  const openQuestions = questions.filter(q => !q.isClosed);
  const closedQuestions = questions.filter(q => q.isClosed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-all ${tab === 'open' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTab('open')}
          >
            Open Questions
          </button>
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-all ${tab === 'closed' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTab('closed')}
          >
            Closed Questions
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {tab === 'open' && (
              <QuestionList questions={openQuestions} onSelect={handleSelect} />
            )}
            {tab === 'closed' && (
              <div className="space-y-4">
                {closedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No closed questions yet.</div>
                ) : (
                  closedQuestions.map(q => (
                    <div key={q.id} className="p-4 rounded-lg shadow border bg-white flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-indigo-700">{q.title}</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Closed</span>
                      </div>
                      <div className="text-gray-600 text-sm">{q.description}</div>
                      <div className="text-indigo-900 text-lg">{q.equation}</div>
                      <div className="text-xs text-gray-400">Attempts: {q.attempts}</div>
                      <div className="mt-2">
                        <span className="font-semibold text-green-700">Best Answer:</span> {q.bestSolution || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Solved</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
        {selected && (
          <QuestionModal
            question={selected}
            fullQuestion={selectedFull}
            onClose={handleCloseModal}
            onSubmitSolution={handleSubmitSolution}
            solutions={solutions[selected.id] || []}
          />
        )}
      </div>
    </div>
  );
};

export default MathQA;
