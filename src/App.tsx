import { useState, useEffect, useCallback } from 'react';
import type { SimData, Lang, Ethnicity, ModalType, SimNode, AudioMap, ContextNode, TextImageNode, OutcomeNode, DecisionNode } from './types';
import Header from './components/Header';
import LeftRail from './components/LeftRail';
import Footer from './components/Footer';
import SetupSlide from './components/SetupSlide';
import ContextSlide from './components/ContextSlide';
import TextImageSlide from './components/TextImageSlide';
import VideoSlide from './components/VideoSlide';
import DecisionSlide from './components/DecisionSlide';
import OutcomeSlide from './components/OutcomeSlide';
import SummarySlide from './components/SummarySlide';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import ModalBackdrop from './components/ModalBackdrop';
import BriefModal from './components/BriefModal';
import CastModal from './components/CastModal';
import HelpModal from './components/HelpModal';

const PROGRESS: Record<string, number> = {
  setup: 0, context: 16, text_image: 33, video: 50,
  decision: 67, outcome_a: 83, outcome_b: 83, summary: 100,
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [ethnicity, setEthnicity] = useState<Ethnicity>('african');
  const [simData, setSimData] = useState<SimData | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('setup');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioMap, setAudioMap] = useState<AudioMap>({});
  const [timerSecs, setTimerSecs] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(true);

  // Timer
  useEffect(() => {
    if (currentNodeId === 'setup') { setTimerSecs(0); return; }
    const id = setInterval(() => setTimerSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [currentNodeId === 'setup']);

  const startSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/simulation?lang=${lang}&ethnicity=${ethnicity}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: SimData = await r.json();

      // Build per-slide narration texts and preload ElevenLabs audio
      const n = data.nodes;
      const ctx  = n['context']    as ContextNode   | undefined;
      const ti   = n['text_image'] as TextImageNode  | undefined;
      const outA = n['outcome_a']  as OutcomeNode    | undefined;
      const dec  = n['decision']   as DecisionNode   | undefined;

      const texts: Record<string, string> = {
        context:    [ctx?.body, ctx?.learning_objective_body].filter(Boolean).join(' '),
        text_image: ti?.body ?? '',
        decision:   dec ? [dec.prompt, ...dec.choices.map(c => `Option ${c.id}: ${c.label}`)].join('. ') : '',
        outcome_a:  outA?.body ?? '',
      };

      const ttsR = await fetch('/api/tts/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, lang }),
      });
      if (ttsR.ok) {
        const map: AudioMap = await ttsR.json();
        setAudioMap(map);
      } else {
        console.error('TTS preload failed:', ttsR.status, await ttsR.text());
      }

      setSimData(data);
      setCurrentNodeId(data.start_node_id);
      setHistoryStack([]);
      setChosenId(null);
      setTimerSecs(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [lang, ethnicity]);

  const goNext = useCallback(() => {
    if (!simData) return;
    const node = simData.nodes[currentNodeId];
    if (!node || !node.next_node_id) return;
    setHistoryStack(h => [...h, currentNodeId]);
    setCurrentNodeId(node.next_node_id);
  }, [simData, currentNodeId]);

  const goBack = useCallback(() => {
    if (historyStack.length === 0) {
      setCurrentNodeId('setup');
      setSimData(null);
      setChosenId(null);
      return;
    }
    setHistoryStack(h => {
      const next = [...h];
      const prev = next.pop()!;
      setCurrentNodeId(prev);
      return next;
    });
  }, [historyStack]);

  const chooseOption = useCallback((targetNodeId: string, choiceId: string) => {
    setHistoryStack(h => [...h, currentNodeId]);
    setChosenId(choiceId);
    setCurrentNodeId(targetNodeId);
  }, [currentNodeId]);

  const restart = useCallback(() => {
    setCurrentNodeId('setup');
    setSimData(null);
    setChosenId(null);
    setHistoryStack([]);
    setTimerSecs(0);
  }, []);

  const isSetup = currentNodeId === 'setup';
  const progress = PROGRESS[currentNodeId] ?? 0;
  const ui = simData?.ui;
  const currentNode: SimNode | null = simData?.nodes[currentNodeId] ?? null;

  // keyboard A/B on decision node
  useEffect(() => {
    if (!currentNode || currentNode.type !== 'decision') return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const choice = currentNode.choices.find(c => c.id === key);
      if (choice) {
        e.preventDefault();
        chooseOption(choice.target_node_id, choice.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentNode, chooseOption]);

  const showBack = !isSetup && !loading && !error;
  const showNext = !isSetup && !loading && !error && currentNode?.type !== 'decision' && currentNode?.type !== 'summary' && currentNode?.next_node_id != null;

  return (
    <div id="app" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header
        simTitle={ui?.sim_title ?? 'Leadership Decision Simulation'}
        progress={progress}
        slideLabel={isSetup ? 'Setup' : currentNode?.step_badge ?? ''}
        timerSecs={timerSecs}
        lang={isSetup ? null : lang.toUpperCase()}
        ethnicity={isSetup ? null : (simData?.ui.ethnicity_labels?.[ethnicity] ?? ethnicity)}
        speechEnabled={speechEnabled}
        onToggleSpeech={() => { setSpeechEnabled(s => !s); window.speechSynthesis.cancel(); }}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftRail
          onBrief={() => setModal('brief')}
          onCast={() => setModal('cast')}
          onHelp={() => setModal('help')}
          onReset={restart}
          briefTip={ui?.rail_brief_tip ?? 'Brief'}
          castTip={ui?.rail_cast_tip ?? 'Cast'}
          helpTip={ui?.rail_help_tip ?? 'Help'}
        />

        <main className="stage" style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 32px' }}>
          {loading && <LoadingState />}
          {!loading && error && (
            <ErrorState
              title={ui?.sim_error_title ?? 'Failed to load simulation'}
              body={error}
              retryLabel={ui?.retry_btn ?? 'Retry'}
              onRetry={startSimulation}
            />
          )}
          {!loading && !error && isSetup && (
            <SetupSlide
              key={currentNodeId}
              lang={lang}
              ethnicity={ethnicity}
              onLangChange={setLang}
              onEthnicityChange={setEthnicity}
              onStart={startSimulation}
            />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'context' && (
            <ContextSlide key={currentNodeId} node={currentNode} audioUrl={audioMap['context'] ?? null} speechEnabled={speechEnabled} />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'text_image' && simData && (
            <TextImageSlide key={currentNodeId} node={currentNode} photoUrl={simData.media.photo} photoAlt={currentNode.character_alt} audioUrl={audioMap['text_image'] ?? null} speechEnabled={speechEnabled} />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'video' && simData && (
            <VideoSlide
              key={currentNodeId}
              node={currentNode}
              videoUrl={simData.media.video_template.replace('{lang}', lang)}
              captionsUrl={`/assets/captions_${lang}.vtt`}
              captionsOn={captionsOn}
              onToggleCaptions={() => setCaptionsOn(c => !c)}
              audioUrl={audioMap['video'] ?? null}
              speechEnabled={speechEnabled}
            />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'decision' && (
            <DecisionSlide key={currentNodeId} node={currentNode} chosenId={chosenId} onChoose={chooseOption} audioUrl={audioMap['decision'] ?? null} speechEnabled={speechEnabled} />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'outcome' && (
            <OutcomeSlide key={currentNodeId} node={currentNode} audioUrl={audioMap[currentNodeId] ?? null} speechEnabled={speechEnabled} />
          )}
          {!loading && !error && !isSetup && currentNode?.type === 'summary' && simData && (
            <SummarySlide
              key={currentNodeId}
              node={currentNode}
              chosenNode={chosenId ? (simData.nodes[chosenId === 'A' ? 'outcome_a' : 'outcome_b'] as import('./types').OutcomeNode) : null}
              optionLabel={ui?.option_label ?? 'Option'}
              audioUrl={audioMap['summary'] ?? null}
              speechEnabled={speechEnabled}
              lang={lang}
              ethnicity={ethnicity}
              chosenId={chosenId}
              reviewTitle={ui?.review_title ?? 'Rate This Simulation'}
              reviewRatingLabel={ui?.review_rating_label ?? 'How would you rate this simulation?'}
              reviewExperienceLabel={ui?.review_experience_label ?? 'How was your experience?'}
              reviewImprovementsLabel={ui?.review_improvements_label ?? 'Any suggested improvements?'}
              reviewSubmitBtn={ui?.review_submit_btn ?? 'Submit Feedback'}
              reviewThankYou={ui?.review_thank_you ?? 'Thank you for your feedback!'}
            />
          )}
        </main>
      </div>

      <Footer
        showBack={showBack}
        showNext={showNext}
        backLabel={ui?.back_btn ?? 'Back'}
        nextLabel={ui?.next_btn ?? 'Next'}
        onBack={goBack}
        onNext={goNext}
        currentNodeId={currentNodeId}
        totalNodes={simData ? Object.keys(simData.nodes).length : 0}
        restartLabel={ui?.restart_btn ?? 'Restart Simulation'}
        onRestart={restart}
      />

      {modal && (
        <ModalBackdrop onClose={() => setModal(null)}>
          {modal === 'brief' && ui && <BriefModal ui={ui} onClose={() => setModal(null)} />}
          {modal === 'cast' && <CastModal ui={ui} simData={simData} onClose={() => setModal(null)} />}
          {modal === 'help' && ui && <HelpModal ui={ui} onClose={() => setModal(null)} />}
        </ModalBackdrop>
      )}
    </div>
  );
}
