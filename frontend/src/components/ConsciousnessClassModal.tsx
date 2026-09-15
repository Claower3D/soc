import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, ChevronRight, RotateCcw, 
  BookOpen, Brain, Lightbulb, Compass,
  Apple, Binary, Wrench, Share2, X
} from 'lucide-react';
import { 
  CONSCIOUSNESS_QUIZ_QUESTIONS, 
  CONSCIOUSNESS_CLASSES, 
  COGNITION_VECTORS, 
  calculateConsciousnessResult,
  type QuizResult,
  type CognitionVector 
} from '../data/consciousnessData';
import { useAuth } from '../context/AuthContext';
import './ConsciousnessClassModal.css';

interface ConsciousnessClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (result: QuizResult) => void;
}

export const ConsciousnessClassModal: React.FC<ConsciousnessClassModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const { updateProfile, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'test' | 'all_classes' | 'languages'>('test');
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('new_age_consciousness_profile'));
  });
  const [result, setResult] = useState<QuizResult | null>(() => {
    const saved = localStorage.getItem('new_age_consciousness_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentQuestion = CONSCIOUSNESS_QUIZ_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep) / CONSCIOUSNESS_QUIZ_QUESTIONS.length) * 100);

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentStep] = optionIndex;
    setSelectedAnswers(newAnswers);

    if (currentStep < CONSCIOUSNESS_QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 250);
    } else {
      const finalResult = calculateConsciousnessResult(newAnswers);
      setResult(finalResult);
      setIsCompleted(true);
      localStorage.setItem('new_age_consciousness_profile', JSON.stringify(finalResult));
      if (isAuthenticated) {
        updateProfile({
          consciousnessLevel: finalResult.level,
          consciousnessTitle: finalResult.classInfo.title,
          cognitionVector: finalResult.dominantVector
        });
      }
      if (onSaved) onSaved(finalResult);
    }
  };

  const handleResetTest = () => {
    setSelectedAnswers([]);
    setCurrentStep(0);
    setIsCompleted(false);
    setSaveSuccess(false);
  };

  const handleSaveToProfile = () => {
    if (!result) return;
    updateProfile({
      consciousnessLevel: result.level,
      consciousnessTitle: result.classInfo.title,
      cognitionVector: result.dominantVector
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getVectorIcon = (vec: CognitionVector) => {
    switch (vec) {
      case 'visual_analogies': return <Apple size={18} className="vec-icon icon-apple" />;
      case 'exact_sciences': return <Binary size={18} className="vec-icon icon-binary" />;
      case 'pragmatic': return <Wrench size={18} className="vec-icon icon-wrench" />;
      case 'philosophical': return <BookOpen size={18} className="vec-icon icon-book" />;
      case 'spiritual': return <Sparkles size={18} className="vec-icon icon-sparkle" />;
      default: return <Brain size={18} />;
    }
  };

  return (
    <div className="consciousness-modal-backdrop" onClick={onClose}>
      <div className="consciousness-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="consciousness-modal-header">
          <div className="cm-header-titles">
            <div className="cm-tag-row">
              <span className="cm-brand-tag"><Sparkles size={12} /> NEW AGE СИСТЕМА</span>
              <span className="cm-motto-tag">«Спасение служба»</span>
            </div>
            <h2 className="cm-title">Классы Сознания & Язык Восприятия</h2>
            <p className="cm-subtitle">
              Уникальная диагностика восприятия человека: от 1 до 11 класса. На каком языке говорить: на яблоках, формулах или паттернах?
            </p>
          </div>
          <button className="cm-close-btn" onClick={onClose} title="Закрыть">
            <X size={20} />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="cm-nav-tabs">
          <button 
            className={`cm-tab-btn ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            <Brain size={16} />
            <span>Диагностика ({isCompleted ? 'Результат' : 'Тест'})</span>
          </button>
          <button 
            className={`cm-tab-btn ${activeTab === 'all_classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_classes')}
          >
            <Compass size={16} />
            <span>Все 11 Классов</span>
          </button>
          <button 
            className={`cm-tab-btn ${activeTab === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveTab('languages')}
          >
            <Lightbulb size={16} />
            <span>5 Языков Общения</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="cm-modal-body">
          {/* TAB 1: ТЕСТ ИЛИ РЕЗУЛЬТАТ */}
          {activeTab === 'test' && (
            <div className="cm-test-container">
              {!isCompleted ? (
                <div className="cm-quiz-flow">
                  {/* Progress Header */}
                  <div className="cm-quiz-progress-bar-wrap">
                    <div className="cm-quiz-progress-labels">
                      <span>Вопрос {currentStep + 1} из {CONSCIOUSNESS_QUIZ_QUESTIONS.length}</span>
                      <span className="cm-percent-val">{progressPercent}% пройдено</span>
                    </div>
                    <div className="cm-progress-track">
                      <div className="cm-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  {/* Question Box */}
                  <div className="cm-question-card">
                    <span className="cm-q-num-pill">Ситуация #{currentStep + 1}</span>
                    <h3 className="cm-question-title">{currentQuestion.situation}</h3>
                    <p className="cm-question-subtitle">{currentQuestion.subtitle}</p>

                    <div className="cm-options-list">
                      {currentQuestion.options.map((opt, idx) => {
                        const isSelected = selectedAnswers[currentStep] === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`cm-option-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOption(idx)}
                          >
                            <div className="cm-opt-left">
                              <span className="cm-opt-radio">{isSelected && <span className="cm-opt-radio-dot" />}</span>
                              <div className="cm-opt-text-wrap">
                                <p className="cm-opt-text">{opt.text}</p>
                                <span className="cm-opt-vector-tag">
                                  {getVectorIcon(opt.vector)}
                                  <span>{COGNITION_VECTORS[opt.vector].title}</span>
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={18} className="cm-opt-chevron" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Back button if needed */}
                  {currentStep > 0 && (
                    <div className="cm-quiz-actions">
                      <button 
                        type="button" 
                        className="cm-btn-back"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                      >
                        ← Вернуться к предыдущему вопросу
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* RESULT SCREEN */
                result && (
                  <div className="cm-result-card">
                    <div className="cm-result-header" style={{ background: result.classInfo.gradient }}>
                      <div className="cm-result-header-content">
                        <span className="cm-res-stage-pill">{result.classInfo.stage}</span>
                        <h3 className="cm-res-class-name">{result.classInfo.title}</h3>
                        <p className="cm-res-short-desc">{result.classInfo.shortDesc}</p>
                      </div>
                      <div className="cm-res-badge-circle">
                        <span className="cm-res-badge-num">{result.level}</span>
                        <span className="cm-res-badge-lbl">класс</span>
                      </div>
                    </div>

                    <div className="cm-result-details-grid">
                      {/* Language Advice Box */}
                      <div className="cm-res-box cm-res-language-box">
                        <div className="cm-box-head">
                          {getVectorIcon(result.dominantVector)}
                          <div>
                            <h4 className="cm-box-title">Ведущий язык восприятия</h4>
                            <span className="cm-box-subtitle">{result.vectorInfo.title} ({result.vectorInfo.tagline})</span>
                          </div>
                        </div>
                        <div className="cm-box-body">
                          <p className="cm-key-advice">
                            <strong>Как общаться с вами:</strong> {result.classInfo.languageAdvice}
                          </p>
                          <div className="cm-example-phrase-card">
                            <span className="cm-ex-badge">Пример подачи мысли:</span>
                            <p className="cm-ex-text">«{result.classInfo.examplePhrase}»</p>
                          </div>
                        </div>
                      </div>

                      {/* Growth Zone Box */}
                      <div className="cm-res-box cm-res-growth-box">
                        <div className="cm-box-head">
                          <Lightbulb size={20} className="vec-icon icon-light" />
                          <div>
                            <h4 className="cm-box-title">Зона ближайшего развития</h4>
                            <span className="cm-box-subtitle">Переход в следующий класс</span>
                          </div>
                        </div>
                        <div className="cm-box-body">
                          <p className="cm-growth-desc">{result.classInfo.growthZone}</p>
                          <p className="cm-growth-deep">{result.classInfo.fullDesc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vector Breakdown Row */}
                    <div className="cm-vector-breakdown-row">
                      <h4 className="cm-breakdown-title">Спектр ваших стилей восприятия:</h4>
                      <div className="cm-vectors-bars">
                        {(Object.keys(COGNITION_VECTORS) as CognitionVector[]).map((vecKey) => {
                          const vec = COGNITION_VECTORS[vecKey];
                          const score = result.vectorScores[vecKey] || 0;
                          const totalQ = CONSCIOUSNESS_QUIZ_QUESTIONS.length;
                          const pct = Math.round((score / totalQ) * 100);
                          return (
                            <div key={vecKey} className="cm-bar-item">
                              <div className="cm-bar-info">
                                <span className="cm-bar-name">{vec.title}</span>
                                <span className="cm-bar-pct">{pct}%</span>
                              </div>
                              <div className="cm-bar-track">
                                <div className="cm-bar-fill" style={{ width: `${pct}%`, backgroundColor: vec.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="cm-result-footer-actions">
                      <button 
                        type="button" 
                        className="cm-action-btn cm-btn-save"
                        onClick={handleSaveToProfile}
                      >
                        <CheckCircle2 size={18} />
                        <span>{saveSuccess ? 'Сохранено в профиль!' : 'Закрепить в профиле'}</span>
                      </button>

                      <button 
                        type="button" 
                        className="cm-action-btn cm-btn-retake"
                        onClick={handleResetTest}
                      >
                        <RotateCcw size={16} />
                        <span>Пройти заново</span>
                      </button>

                      <button 
                        type="button" 
                        className="cm-action-btn cm-btn-secondary"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            `Мой класс сознания в New Age: ${result.classInfo.title} (${result.level} класс). Язык общения: ${result.vectorInfo.title}!`
                          );
                          alert('Результат скопирован в буфер обмена!');
                        }}
                      >
                        <Share2 size={16} />
                        <span>Поделиться</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 2: ВСЕ 11 КЛАССОВ */}
          {activeTab === 'all_classes' && (
            <div className="cm-classes-catalog">
              <div className="cm-catalog-intro">
                <p>
                  Шкала сознания от 1 до 11 класса отображает не формальный IQ, а широту видения взаимосвязей, уровень самоответственности и пластичность ума.
                </p>
              </div>

              <div className="cm-classes-grid">
                {CONSCIOUSNESS_CLASSES.map((cls) => {
                  const isCurrent = result?.level === cls.level;
                  return (
                    <div 
                      key={cls.level} 
                      className={`cm-class-item-card ${isCurrent ? 'current-user-class' : ''}`}
                    >
                      <div className="cm-cic-head" style={{ background: cls.gradient }}>
                        <span className="cm-cic-level">{cls.level} КЛАСС</span>
                        <span className="cm-cic-stage">{cls.stage}</span>
                      </div>
                      <div className="cm-cic-body">
                        <h4 className="cm-cic-title">{cls.title}</h4>
                        <p className="cm-cic-desc">{cls.shortDesc}</p>
                        
                        <div className="cm-cic-advice">
                          <span className="cm-cic-label">Язык общения:</span>
                          <p>{cls.languageAdvice}</p>
                        </div>

                        <div className="cm-cic-growth">
                          <span className="cm-cic-label">Зона роста:</span>
                          <p>{cls.growthZone}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 5 ЯЗЫКОВ ОБЩЕНИЯ */}
          {activeTab === 'languages' && (
            <div className="cm-languages-catalog">
              <div className="cm-catalog-intro">
                <p>
                  Людям тяжело слышать друг друга, когда один говорит формулами, а другому нужно объяснить «на яблоках». Выберите правильный регистр общения!
                </p>
              </div>

              <div className="cm-vectors-grid">
                {(Object.keys(COGNITION_VECTORS) as CognitionVector[]).map((vecKey) => {
                  const vec = COGNITION_VECTORS[vecKey];
                  return (
                    <div key={vecKey} className="cm-vec-card" style={{ borderTop: `4px solid ${vec.color}` }}>
                      <div className="cm-vec-head">
                        {getVectorIcon(vecKey)}
                        <div>
                          <h4 className="cm-vec-title">{vec.title}</h4>
                          <span className="cm-vec-tagline">{vec.tagline}</span>
                        </div>
                      </div>
                      <div className="cm-vec-content">
                        <div className="cm-vec-field">
                          <strong>Предпочитаемый формат:</strong>
                          <p>{vec.preferredFormat}</p>
                        </div>
                        <div className="cm-vec-field highlight">
                          <strong>Ключ к продуктивному диалогу:</strong>
                          <p>{vec.communicationKey}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
