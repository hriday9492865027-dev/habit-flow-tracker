'use client';

import React, { useState, useCallback } from 'react';
import { QuestionList } from '@/components/questions/QuestionList';
import type { Question } from '@/types';

interface QuestionsClientProps {
  initialQuestions: Question[];
}

export function QuestionsClient({ initialQuestions }: QuestionsClientProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/questions?includeArchived=true');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to refresh questions:', err);
    }
  }, []);

  return <QuestionList initialQuestions={questions} onRefresh={handleRefresh} />;
}
