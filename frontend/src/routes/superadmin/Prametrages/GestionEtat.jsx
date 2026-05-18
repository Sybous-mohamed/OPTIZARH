import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Trash2, ChevronUp, ChevronDown, Download,
  Users, DollarSign, FileText,
  Copy, Check, AlertCircle, Loader,
  Layers, Briefcase, Award, Eye, EyeOff, Grid3x3, List,
  Sparkles, Database, Star, ArrowLeft
} from 'lucide-react';

import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';
import { useTheme } from '../../../context/ThemeContext';

// ─────────────────────────────────────────────────────────────
//  Tokens de design partagés — toujours utiliser ces valeurs
//  pour garantir la cohérence visuelle en dark/light mode.
// ─────────────────────────────────────────────────────────────
const tokens = (dark) => ({
  page:        dark ? 'bg-black'                      : 'bg-gray-50',
  card:        dark ? 'bg-[#141416] border-[#232329]'     : 'bg-white border-gray-200/80',
  cardInner:   dark ? 'bg-[#0D0D0F] border-[#232329]'     : 'bg-gray-50 border-gray-100',
  cardSub:     dark ? 'bg-[#141416] border-[#232329]'     : 'bg-white border-gray-200/80',
  header:      dark ? 'bg-[#141416] border-[#232329]'     : 'bg-gray-50/80 border-gray-100',
  text:        dark ? 'text-[#EAEAF0]'                    : 'text-gray-900',
  textMuted:   dark ? 'text-[#5E5E72]'                    : 'text-gray-400',
  textSoft:    dark ? 'text-[#9090A8]'                    : 'text-gray-500',
  input:       dark ? 'bg-transparent text-[#EAEAF0]'     : 'bg-transparent text-gray-900',
  accent:      'text-indigo-500',
  border:      dark ? 'border-[#232329]'                  : 'border-gray-200/80',
});

// ─────────────────────────────────────────────────────────────
//  StatCard — carte de statistique individuelle
//  Props : title, value, icon, accent (couleur Tailwind)
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, accent, dark }) => {
  const t = tokens(dark);
  return (
    <div className={`${t.card} border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl bg-${accent}-500/10`}>
          <Icon size={16} className={`text-${accent}-500`} />
        </div>
        <span className={`text-2xl font-black tabular-nums ${t.text}`}>{value}</span>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted}`}>{title}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  YearControl — contrôle de l'année (flèches haut/bas + input)
// ─────────────────────────────────────────────────────────────
const YearControl = ({ year, dark, onChange, onUp, onDown, onBlur, onKeyDown }) => {
  const t = tokens(dark);
  return (
    <div className={`${t.card} border flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted}`}>Année</span>
      <input
        type="number"
        value={year}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`w-16 font-black text-center outline-none text-sm text-indigo-500 ${dark ? 'bg-transparent' : 'bg-transparent'}`}
      />
      <div className="flex flex-col gap-0.5">
        <button onClick={onUp}  className={`cursor-pointer p-0.5 rounded ${t.textMuted} hover:text-indigo-500 transition-colors`}><ChevronUp  size={10}/></button>
        <button onClick={onDown} className={`cursor-pointer p-0.5 rounded ${t.textMuted} hover:text-indigo-500 transition-colors`}><ChevronDown size={10}/></button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  PrimaryButton — bouton d'action principal (couleur variable)
// ─────────────────────────────────────────────────────────────
const PrimaryButton = ({ onClick, disabled, icon: Icon, label, color = 'indigo', loading = false }) => {
  const colors = {
    indigo : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
    red    : 'bg-rose-600   hover:bg-rose-700   shadow-rose-500/25',
    gray   : 'bg-gray-500   cursor-not-allowed',
    blue   : 'bg-blue-600   hover:bg-blue-700   shadow-blue-500/25',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer flex items-center gap-2 ${colors[color]} text-white px-4 py-2 rounded-2xl text-[11px] font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? <Loader size={13} className="animate-spin"/> : Icon ? <Icon size={13}/> : null}
      {label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
//  EchelonRow — ligne d'un échelon (order, index, salaire)
// ─────────────────────────────────────────────────────────────
const EchelonRow = ({
  ecl, ecIdx, pIdx, gIdx, eIdx,
  dark, hasUnsavedChanges, copiedIndex,
  onChangeIndexVal, onChangeSalary,
  onDuplicate, onDelete,
  isDeleting,
}) => {
  const t = tokens(dark);
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border ${t.border} ${dark ? 'bg-[#0D0D0F] hover:bg-[#141416]' : 'bg-white hover:bg-gray-50'} transition-all`}>
      {/* Badge ordre */}
      <span className={`min-w-[26px] text-center px-1.5 py-0.5 rounded-lg font-mono text-[9px] font-bold ${dark ? 'bg-[#232329] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        E{ecl.order}
      </span>

      {/* Index */}
      <div className="flex items-center gap-0.5 flex-1">
        <span className={`text-[8px] ${t.textMuted}`}>Idx</span>
        <input
          type="number"
          value={ecl.index_val}
          onChange={onChangeIndexVal}
          className={`w-12 outline-none font-bold text-right text-[10px] text-indigo-500 ${dark ? 'bg-transparent' : 'bg-transparent'}`}
        />
      </div>

      {/* Salaire */}
      <input
        type="number"
        value={ecl.salary}
        onChange={onChangeSalary}
        className={`w-20 text-right font-black outline-none text-[10px] ${dark ? 'text-emerald-400 bg-transparent' : 'text-emerald-600 bg-transparent'}`}
      />
      <span className={`text-[8px] ${t.textMuted}`}>MAD</span>

      {/* Actions */}
      <button onClick={onDuplicate} title="Dupliquer" className=" cursor-pointer p-0.5 text-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
        {copiedIndex === ecIdx ? <Check size={9}/> : <Copy size={9}/>}
      </button>
      <button
        onClick={onDelete}
        disabled={isDeleting || (hasUnsavedChanges && !ecl._isNew)}
        title={(hasUnsavedChanges && !ecl._isNew) ? "Sauvegardez d'abord" : "Supprimer"}
        className={` cursor-pointer p-0.5 rounded transition-all cursor-pointer ${(hasUnsavedChanges && !ecl._isNew) ? 'text-gray-400 cursor-not-allowed' : 'text-rose-400 hover:text-rose-600'}`}
      >
        {isDeleting ? <Loader size={8} className="animate-spin"/> : <Trash2 size={9}/>}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  EchelleCard — carte d'une échelle avec ses échelons
// ─────────────────────────────────────────────────────────────
const EchelleCard = ({
  ech, eIdx, pIdx, gIdx,
  dark, config, setConfig,
  hasUnsavedChanges, copiedIndex,
  addEchelon, duplicateEchelon,
  deleteEchelleLocal, handleDeleteEchelle,
  deleteEchelonLocal, handleDeleteEchelon,
  deleting, post, grade,
}) => {
  const t = tokens(dark);
  const isDelEch = deleting.type === 'echelle' && deleting.id === ech.id;

  return (
    <div className={`${t.cardInner} border rounded-2xl p-3 transition-all hover:shadow-md group`}>
      {/* En-tête de l'échelle */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold uppercase tracking-widest ${t.textMuted}`}>Échelle</span>
          <input
            value={ech.level}
            onChange={(e) => {
              const np = [...config.Post];
              np[pIdx].grades[gIdx].echelles[eIdx].level = e.target.value;
              setConfig({ ...config, Post: np });
            }}
            className={`w-10 border rounded-lg px-1.5 py-0.5 text-center font-bold outline-none text-xs text-indigo-500 ${dark ? 'bg-[#141416] border-[#232329]' : 'bg-white border-gray-200'}`}
            placeholder="N°"
          />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => addEchelon(post.id, grade.id, ech.id)}
            className="cursor-pointer text-[9px] text-emerald-500 font-semibold hover:underline px-1.5"
          >
            + Échelon
          </button>
          <button
            onClick={() => ech._isNew ? deleteEchelleLocal(ech.id, post.id, grade.id) : handleDeleteEchelle(ech.id, post.id, grade.id)}
            disabled={isDelEch || (hasUnsavedChanges && !ech._isNew)}
            className={`cursor-pointer p-0.5 rounded transition-all ${(hasUnsavedChanges && !ech._isNew) ? 'text-gray-400 cursor-not-allowed' : 'text-rose-400 hover:text-rose-600'}`}
          >
            {isDelEch ? <Loader size={9} className="animate-spin"/> : <Trash2 size={10}/>}
          </button>
        </div>
      </div>

      {/* Liste des échelons */}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
        {(ech.echelons || []).map((ecl, ecIdx) => (
          <EchelonRow
            key={ecl.id}
            ecl={ecl} ecIdx={ecIdx} pIdx={pIdx} gIdx={gIdx} eIdx={eIdx}
            dark={dark}
            hasUnsavedChanges={hasUnsavedChanges}
            copiedIndex={copiedIndex}
            onChangeIndexVal={(e) => {
              const np = [...config.Post];
              np[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx].index_val = e.target.value;
              setConfig({ ...config, Post: np });
            }}
            onChangeSalary={(e) => {
              const np = [...config.Post];
              np[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx].salary = e.target.value;
              setConfig({ ...config, Post: np });
            }}
            onDuplicate={() => duplicateEchelon(pIdx, gIdx, eIdx, ecIdx)}
            onDelete={() => ecl._isNew ? deleteEchelonLocal(ecl.id, post.id, grade.id, ech.id) : handleDeleteEchelon(ecl.id, post.id, grade.id, ech.id)}
            isDeleting={deleting.type === 'echelon' && deleting.id === ecl.id}
          />
        ))}
        {(ech.echelons || []).length === 0 && (
          <p className={`text-center py-4 text-[9px] ${t.textMuted}`}>Aucun échelon</p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  GradeBlock — bloc d'un grade avec ses échelles
// ─────────────────────────────────────────────────────────────
const GradeBlock = ({
  grade, gIdx, pIdx,
  dark, config, setConfig,
  compactView, hasUnsavedChanges,
  copiedIndex, deleting, post,
  addEchelle, addEchelon,
  duplicateEchelon,
  deleteGradeLocal, handleDeleteGrade,
  deleteEchelleLocal, handleDeleteEchelle,
  deleteEchelonLocal, handleDeleteEchelon,
}) => {
  const t = tokens(dark);
  const isDelGrade = deleting.type === 'grade' && deleting.id === grade.id;

  return (
    <div className={`${t.cardSub} border rounded-2xl p-4 transition-all hover:shadow-md`}>
      {/* En-tête du grade */}
      <div className={`flex justify-between items-center mb-4 pb-3 border-b ${t.border}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${dark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
            <Award size={13} className="text-emerald-500"/>
          </div>
          <input
            value={grade.name}
            onChange={(e) => {
              const np = [...config.Post];
              np[pIdx].grades[gIdx].name = e.target.value;
              setConfig({ ...config, Post: np });
            }}
            className={`font-semibold outline-none text-sm ${t.input}`}
            placeholder="Nom du grade..."
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addEchelle(post.id, grade.id)}
            className="cursor-pointer text-[10px] bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-xl font-semibold hover:bg-indigo-500/20 transition-all"
          >
            + Échelle
          </button>
          <button
            onClick={() => grade._isNew ? deleteGradeLocal(grade.id, post.id) : handleDeleteGrade(grade.id, post.id)}
            disabled={isDelGrade || (hasUnsavedChanges && !grade._isNew)}
            className={`cursor-pointer p-1.5 rounded-xl transition-all ${(hasUnsavedChanges && !grade._isNew) ? 'text-gray-400 cursor-not-allowed' : 'text-rose-400 hover:text-rose-600 hover:bg-rose-500/10'}`}
          >
            {isDelGrade ? <Loader size={12} className="animate-spin"/> : <Trash2 size={12}/>}
          </button>
        </div>
      </div>

      {/* Grille des échelles */}
      <div className={`grid ${compactView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
        {(grade.echelles || []).map((ech, eIdx) => (
          <EchelleCard
            key={ech.id}
            ech={ech} eIdx={eIdx} pIdx={pIdx} gIdx={gIdx}
            dark={dark} config={config} setConfig={setConfig}
            hasUnsavedChanges={hasUnsavedChanges}
            copiedIndex={copiedIndex} deleting={deleting}
            post={post} grade={grade}
            addEchelon={addEchelon} duplicateEchelon={duplicateEchelon}
            deleteEchelleLocal={deleteEchelleLocal} handleDeleteEchelle={handleDeleteEchelle}
            deleteEchelonLocal={deleteEchelonLocal} handleDeleteEchelon={handleDeleteEchelon}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  PostCard — carte principale d'un poste (poste > grades)
// ─────────────────────────────────────────────────────────────
const PostCard = ({
  post, pIdx, dark, config, setConfig,
  compactView, hasUnsavedChanges, copiedIndex,
  deleting, postStarred,
  selectedPostId, setSelectedPostId,
  addGrade, addEchelle, addEchelon,
  duplicateEchelon, togglePostStar,
  deletePostLocal, handleDeletePost,
  deleteGradeLocal, handleDeleteGrade,
  deleteEchelleLocal, handleDeleteEchelle,
  deleteEchelonLocal, handleDeleteEchelon,
  loading,
}) => {
  const t = tokens(dark);
  const isDelPost  = deleting.type === 'post' && deleting.id === post.id;
  const isExpanded = selectedPostId === post.id;
  const isStarred  = postStarred[post.id];

  return (
    <div className={`${t.card} border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl`}>
      {/* ── En-tête du poste ── */}
      <div className={`${t.header} border-b ${t.border} px-5 py-3.5 flex flex-wrap justify-between items-center gap-3`}>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`p-1.5 rounded-xl ${dark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
              <Briefcase size={13} className="text-indigo-500"/>
            </div>
            <input
              value={post.name}
              onChange={(e) => {
                const np = [...config.Post];
                np[pIdx].name = e.target.value;
                setConfig({ ...config, Post: np });
              }}
              className={`font-bold outline-none text-sm focus:border-b-2 border-indigo-400 ${t.input} w-full`}
              placeholder="Nom du poste..."
            />
          </div>
          <p className={`text-[9px] ml-9 ${t.textMuted}`}>
            {(post.grades || []).length} grade{(post.grades || []).length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bouton étoile — rend le poste disponible pour toutes les années */}
          <button
            onClick={() => togglePostStar(post.id, post.name)}
            disabled={hasUnsavedChanges || loading}
            title={isStarred ? "Disponible dans toutes les années" : "Copier vers toutes les années"}
            className={`cursor-pointer p-1.5 rounded-xl transition-all ${hasUnsavedChanges ? 'text-gray-400 cursor-not-allowed' : isStarred ? 'text-yellow-400 hover:text-yellow-500 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400'}`}
          >
            <Star size={14} fill={isStarred ? "currentColor" : "none"}/>
          </button>

          {/* Bouton expand/collapse */}
          <button
            onClick={() => setSelectedPostId(isExpanded ? null : post.id)}
            className={`cursor-pointer p-1.5 rounded-xl transition-all ${dark ? 'hover:bg-[#232329]' : 'hover:bg-gray-100'}`}
            title={isExpanded ? "Masquer" : "Afficher"}
          >
            {isExpanded
              ? <EyeOff size={14} className={t.textMuted}/>
              : <Eye    size={14} className={t.textMuted}/>
            }
          </button>

          {/* Bouton suppression poste */}
          <button
            onClick={() => post._isNew ? deletePostLocal(post.id) : handleDeletePost(post.id)}
            disabled={isDelPost || (hasUnsavedChanges && !post._isNew)}
            title={(hasUnsavedChanges && !post._isNew) ? "Sauvegardez d'abord" : "Supprimer"}
            className={`cursor-pointer p-1.5 rounded-xl transition-all ${(hasUnsavedChanges && !post._isNew) ? 'text-gray-400 cursor-not-allowed' : 'text-rose-400 hover:text-rose-600 hover:bg-rose-500/10'}`}
          >
            {isDelPost ? <Loader size={14} className="animate-spin"/> : <Trash2 size={14}/>}
          </button>
        </div>
      </div>

      {/* ── Corps : grades visibles seulement si le poste est déployé ── */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {(post.grades || []).map((grade, gIdx) => (
            <GradeBlock
              key={grade.id}
              grade={grade} gIdx={gIdx} pIdx={pIdx}
              dark={dark} config={config} setConfig={setConfig}
              compactView={compactView} hasUnsavedChanges={hasUnsavedChanges}
              copiedIndex={copiedIndex} deleting={deleting} post={post}
              addEchelle={addEchelle} addEchelon={addEchelon}
              duplicateEchelon={duplicateEchelon}
              deleteGradeLocal={deleteGradeLocal} handleDeleteGrade={handleDeleteGrade}
              deleteEchelleLocal={deleteEchelleLocal} handleDeleteEchelle={handleDeleteEchelle}
              deleteEchelonLocal={deleteEchelonLocal} handleDeleteEchelon={handleDeleteEchelon}
            />
          ))}

          {/* Bouton d'ajout de grade en bas du poste */}
          <button
            onClick={() => addGrade(post.id)}
            className="cursor-pointer text-[10px] text-indigo-500 font-semibold hover:underline flex items-center gap-1 px-2 py-1"
          >
            <Plus size={10}/> Ajouter un grade
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  GestionEtat — composant principal
//  Gère la grille salariale annuelle : postes > grades > échelles > échelons
// ═══════════════════════════════════════════════════════════════
const GestionEtat = () => {
  const { darkMode: dark } = useTheme();
  const { showNotification }    = useNotification();
  const navigate                = useNavigate();
  const t                       = tokens(dark);

  // ── Modal de confirmation de suppression ──
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const closeConfirm = () => setConfirmConfig(c => ({ ...c, isOpen: false }));

  // ── État principal ──
  const [config,            setConfig]            = useState({ year: new Date().getFullYear(), Post: [] });
  const [loading,           setLoading]           = useState(false);
  const [deleting,          setDeleting]          = useState({ type: null, id: null });
  const [copiedIndex,       setCopiedIndex]       = useState(null);
  const [isDataSaved,       setIsDataSaved]       = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [compactView,       setCompactView]       = useState(false);
  const [selectedPostId,    setSelectedPostId]    = useState(null);
  const [postStarred,       setPostStarred]       = useState({});
  const [isTyping,          setIsTyping]          = useState(false);

  const fetchTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ── Chargement des postes étoilés depuis le localStorage au montage ──
  useEffect(() => {
    const saved = localStorage.getItem('starred_posts');
    if (saved) setPostStarred(JSON.parse(saved));
  }, []);

  // ── Chargement du mode compact + données initiales ──
  useEffect(() => {
    const savedView = localStorage.getItem('rh_compact_view');
    if (savedView) setCompactView(JSON.parse(savedView));
    fetchYearData();
  }, []);

  // ── Rechargement automatique quand l'année change (debounce 1.2 s) ──
  useEffect(() => {
    if (isTyping) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      if (config.year && config.year !== '') fetchYearData();
    }, 1200);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [config.year, isTyping]);

  // ── Synchronisation des postes étoilés depuis la BDD ──
  useEffect(() => {
    const fetchStarred = async () => {
      try {
        const res = await api.get('/api/gestionEtat/starred-posts');
        const map = {};
        res.data.forEach(p => { map[p.id] = true; });
        setPostStarred(map);
        localStorage.setItem('starred_posts', JSON.stringify(map));
      } catch (e) { console.error('Erreur starred posts:', e); }
    };
    if (config.year && isDataSaved && config.Post.length > 0) fetchStarred();
  }, [config.year, isDataSaved, config.Post.length]);

  // ─────────────────────────────────────────────────────────────
  //  fetchYearData — récupère la config salariale pour l'année
  // ─────────────────────────────────────────────────────────────
  const fetchYearData = async () => {
    if (!config.year || config.year === '') return setLoading(false);
    const yr = parseInt(config.year);
    if (isNaN(yr)) return setLoading(false);
    setLoading(true);
    try {
      const res = await api.get(`/api/gestionEtat/get-by-year/${yr}`);
      if (res.data?.Post) {
        setConfig(prev => ({ ...prev, year: yr, Post: res.data.Post }));
      } else {
        setConfig(prev => ({ ...prev, year: yr, Post: [] }));
      }
      setIsDataSaved(true);
      setHasUnsavedChanges(false);
    } catch {
      setConfig(prev => ({ ...prev, year: yr, Post: [] }));
      setIsDataSaved(true);
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  isValidData — valide la structure avant sauvegarde
  //  Retourne true si tout est correct, false + notifications sinon
  // ─────────────────────────────────────────────────────────────
  const isValidData = () => {
    if (config.Post.length === 0) {
      showNotification("Ajoutez au moins un poste avant d'enregistrer", 'error');
      return false;
    }
    const errors = [];
    config.Post.forEach(post => {
      if (!post.name?.trim()) errors.push(`Poste sans nom`);
      if (!post.grades?.length) errors.push(`"${post.name}" : aucun grade`);
      (post.grades || []).forEach(g => {
        if (!g.name?.trim()) errors.push(`Grade sans nom dans "${post.name}"`);
        if (!g.echelles?.length) errors.push(`"${g.name}" : aucune échelle`);
        (g.echelles || []).forEach(e => {
          if (!e.level?.trim()) errors.push(`Échelle sans niveau dans "${g.name}"`);
          if (!e.echelons?.length) errors.push(`Échelle "${e.level}" : aucun échelon`);
          (e.echelons || []).forEach(ec => {
            if (!ec.salary || ec.salary <= 0) errors.push(`Échelon E${ec.order} : salaire invalide`);
          });
        });
      });
    });
    if (errors.length) {
      errors.slice(0, 5).forEach(m => showNotification(m, 'error'));
      if (errors.length > 5) showNotification(`…et ${errors.length - 5} autre(s)`, 'error');
      return false;
    }
    return true;
  };

  // ─────────────────────────────────────────────────────────────
  //  togglePostStar — active/désactive l'étoile d'un poste (API)
  // ─────────────────────────────────────────────────────────────
  const togglePostStar = async (postId) => {
    if (hasUnsavedChanges) { showNotification('Sauvegardez d\'abord', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.put(`/api/gestionEtat/post/${postId}/toggle-star`);
      const newStarred = { ...postStarred, [postId]: res.data.is_starred };
      setPostStarred(newStarred);
      localStorage.setItem('starred_posts', JSON.stringify(newStarred));
      showNotification(res.data.message, 'success');
      setTimeout(fetchYearData, 1000);
    } catch { showNotification('Erreur modification', 'error'); }
    finally { setLoading(false); }
  };

  // ── Calculs des statistiques globales (uniquement si données sauvegardées) ──
  const totalGrades  = isDataSaved && !hasUnsavedChanges
    ? config.Post.reduce((a, p) => a + (p.grades?.length || 0), 0) : 0;
  const totalEchelles = isDataSaved && !hasUnsavedChanges
    ? config.Post.reduce((a, p) => a + (p.grades || []).reduce((b, g) => b + (g.echelles?.length || 0), 0), 0) : 0;
  const totalEchelons = isDataSaved && !hasUnsavedChanges
    ? config.Post.reduce((a, p) => a + (p.grades || []).reduce((b, g) => b + (g.echelles || []).reduce((c, e) => c + (e.echelons?.length || 0), 0), 0), 0) : 0;
  const totalSalary   = isDataSaved && !hasUnsavedChanges
    ? config.Post.reduce((a, p) => a + (p.grades || []).reduce((b, g) => b + (g.echelles || []).reduce((c, e) => c + (e.echelons || []).reduce((d, ec) => d + (Number(ec.salary) || 0), 0), 0), 0), 0) : 0;

  // ─────────────────────────────────────────────────────────────
  //  changeYear — incrémente/décrémente l'année avec garde-fous
  // ─────────────────────────────────────────────────────────────
  const changeYear = (delta) => {
    const yr = parseInt(config.year) + delta;
    if (yr < 1900 || yr > 2200) { showNotification(`Année ${yr} invalide (1900–2200)`, 'error'); return; }
    if (hasUnsavedChanges) {
      if (!window.confirm(`Passer à ${yr} ? Les modifications non sauvegardées seront perdues.`)) return;
      setHasUnsavedChanges(false);
    }
    setConfig(prev => ({ ...prev, year: yr }));
    setIsDataSaved(false);
    setSelectedPostId(null);
  };

  // ─────────────────────────────────────────────────────────────
  //  addPost — crée un nouveau poste vide dans l'état local
  // ─────────────────────────────────────────────────────────────
  const addPost = () => {
    if (config.year < 1900 || config.year > 2200) {
      showNotification('Année invalide (1900–2200)', 'error'); return;
    }
    const np = { id: Date.now(), name: '', grades: [], _isNew: true };
    setConfig({ ...config, Post: [...config.Post, np] });
    setIsDataSaved(false);
    setHasUnsavedChanges(true);
    setSelectedPostId(np.id);
    showNotification('Nouveau poste créé', 'success');
  };

  // ─────────────────────────────────────────────────────────────
  //  addGrade — ajoute un grade vide à un poste donné (par ID)
  // ─────────────────────────────────────────────────────────────
  const addGrade = (pId) => {
    const ng = { id: Date.now(), name: '', echelles: [], _isNew: true };
    setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: [...(p.grades || []), ng] } : p) });
    setIsDataSaved(false);
    setHasUnsavedChanges(true);
  };

  // ─────────────────────────────────────────────────────────────
  //  addEchelle — ajoute une échelle vide à un grade donné
  // ─────────────────────────────────────────────────────────────
  const addEchelle = (pId, gId) => {
    const ne = { id: Date.now(), level: '', echelons: [], _isNew: true };
    setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).map(g => g.id === gId ? { ...g, echelles: [...(g.echelles || []), ne] } : g) } : p) });
    setIsDataSaved(false);
    setHasUnsavedChanges(true);
  };

  // ─────────────────────────────────────────────────────────────
  //  addEchelon — ajoute un échelon à une échelle donnée
  //  L'index est calculé automatiquement (+3 par rapport au dernier)
  // ─────────────────────────────────────────────────────────────
  const addEchelon = (pId, gId, eId) => {
    setConfig({
      ...config,
      Post: config.Post.map(p => p.id !== pId ? p : {
        ...p, grades: (p.grades || []).map(g => g.id !== gId ? g : {
          ...g, echelles: (g.echelles || []).map(e => {
            if (e.id !== eId) return e;
            const lastIdx = e.echelons?.length ? e.echelons[e.echelons.length - 1].index_val : 0;
            return { ...e, echelons: [...(e.echelons || []), { id: Date.now(), order: (e.echelons || []).length + 1, index_val: lastIdx + 3, salary: 0, _isNew: true }] };
          })
        })
      })
    });
    setIsDataSaved(false);
    setHasUnsavedChanges(true);
  };

  // ─────────────────────────────────────────────────────────────
  //  duplicateEchelon — copie un échelon existant (ordre +1)
  // ─────────────────────────────────────────────────────────────
  const duplicateEchelon = (pIdx, gIdx, eIdx, ecIdx) => {
    const np = [...config.Post];
    const orig = np[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx];
    np[pIdx].grades[gIdx].echelles[eIdx].echelons.push({
      ...orig, id: Date.now(), order: np[pIdx].grades[gIdx].echelles[eIdx].echelons.length + 1
    });
    setConfig({ ...config, Post: np });
    setIsDataSaved(false);
    setHasUnsavedChanges(true);
    setCopiedIndex(ecIdx);
    setTimeout(() => setCopiedIndex(null), 2000);
    showNotification('Échelon dupliqué', 'success');
  };

  // ──────────────────────────────────────────────
  //  Suppressions locales (avant sauvegarde)
  // ──────────────────────────────────────────────

  /** Supprime un poste de l'état local uniquement */
  const deletePostLocal = (pId) => {
    setConfig({ ...config, Post: config.Post.filter(p => p.id !== pId) });
    if (selectedPostId === pId) setSelectedPostId(null);
    setIsDataSaved(false); setHasUnsavedChanges(true);
  };
  /** Supprime un grade de l'état local */
  const deleteGradeLocal = (gId, pId) => {
    setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).filter(g => g.id !== gId) } : p) });
    setIsDataSaved(false); setHasUnsavedChanges(true);
  };
  /** Supprime une échelle de l'état local */
  const deleteEchelleLocal = (eId, pId, gId) => {
    setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).map(g => g.id === gId ? { ...g, echelles: (g.echelles || []).filter(e => e.id !== eId) } : g) } : p) });
    setIsDataSaved(false); setHasUnsavedChanges(true);
  };
  /** Supprime un échelon de l'état local */
  const deleteEchelonLocal = (ecId, pId, gId, eId) => {
    setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).map(g => g.id === gId ? { ...g, echelles: (g.echelles || []).map(e => e.id === eId ? { ...e, echelons: (e.echelons || []).filter(ec => ec.id !== ecId) } : e) } : g) } : p) });
    setIsDataSaved(false); setHasUnsavedChanges(true);
  };

  // ──────────────────────────────────────────────
  //  Suppressions BDD (avec confirmation modale)
  // ──────────────────────────────────────────────

  /** Ouvre la modale de confirmation avant toute suppression BDD */
  const openDeleteModal = (title, message, action) => {
    if (hasUnsavedChanges) { showNotification('Sauvegardez d\'abord', 'error'); return; }
    setConfirmConfig({ isOpen: true, title, message, onConfirm: action });
  };

  /** Supprime un poste en BDD puis met à jour l'état */
  const deletePostFromDB = async (pId) => {
    setDeleting({ type: 'post', id: pId });
    try {
      await api.delete(`/api/gestionEtat/post/${pId}`);
      setConfig({ ...config, Post: config.Post.filter(p => p.id !== pId) });
      showNotification('Poste supprimé', 'success');
    } catch { showNotification('Erreur suppression', 'error'); }
    finally { setDeleting({ type: null, id: null }); }
  };
  /** Supprime un grade en BDD */
  const deleteGradeFromDB = async (gId, pId) => {
    setDeleting({ type: 'grade', id: gId });
    try {
      await api.delete(`/api/gestionEtat/grade/${gId}`);
      setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).filter(g => g.id !== gId) } : p) });
      showNotification('Grade supprimé', 'success');
    } catch { showNotification('Erreur suppression', 'error'); }
    finally { setDeleting({ type: null, id: null }); }
  };
  /** Supprime une échelle en BDD */
  const deleteEchelleFromDB = async (eId, pId, gId) => {
    setDeleting({ type: 'echelle', id: eId });
    try {
      await api.delete(`/api/gestionEtat/echelle/${eId}`);
      setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).map(g => g.id === gId ? { ...g, echelles: (g.echelles || []).filter(e => e.id !== eId) } : g) } : p) });
      showNotification('Échelle supprimée', 'success');
    } catch { showNotification('Erreur suppression', 'error'); }
    finally { setDeleting({ type: null, id: null }); }
  };
  /** Supprime un échelon en BDD */
  const deleteEchelonFromDB = async (ecId, pId, gId, eId) => {
    setDeleting({ type: 'echelon', id: ecId });
    try {
      await api.delete(`/api/gestionEtat/echelon/${ecId}`);
      setConfig({ ...config, Post: config.Post.map(p => p.id === pId ? { ...p, grades: (p.grades || []).map(g => g.id === gId ? { ...g, echelles: (g.echelles || []).map(e => e.id === eId ? { ...e, echelons: (e.echelons || []).filter(ec => ec.id !== ecId) } : e) } : g) } : p) });
      showNotification('Échelon supprimé', 'success');
    } catch { showNotification('Erreur suppression', 'error'); }
    finally { setDeleting({ type: null, id: null }); }
  };

  /** Handlers de suppression : choisissent local vs BDD selon _isNew */
  const handleDeletePost   = (pId)          => openDeleteModal('Supprimer le poste',   'Supprimer ce poste et toutes ses données liées ?',          () => deletePostFromDB(pId));
  const handleDeleteGrade  = (gId, pId)     => openDeleteModal('Supprimer le grade',   'Supprimer ce grade ?',                                       () => deleteGradeFromDB(gId, pId));
  const handleDeleteEchelle= (eId, pId, gId)=> openDeleteModal("Supprimer l'échelle",  'Supprimer cette échelle et ses échelons ?',                   () => deleteEchelleFromDB(eId, pId, gId));
  const handleDeleteEchelon= (ecId, pId, gId, eId) => openDeleteModal("Supprimer l'échelon", 'Supprimer cet échelon ?', () => deleteEchelonFromDB(ecId, pId, gId, eId));

  // ─────────────────────────────────────────────────────────────
  //  handleSave — valide puis envoie la config en BDD
  // ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (config.year < 1900 || config.year > 2200) { showNotification('Année invalide', 'error'); return; }
    if (!isValidData()) return;
    setLoading(true);
    try {
      // Nettoie les flags _isNew avant envoi
      const payload = {
        year: config.year,
        Post: config.Post.map(({ _isNew: _p, ...post }) => ({
          ...post,
          grades: (post.grades || []).map(({ _isNew: _g, ...g }) => ({
            ...g,
            echelles: (g.echelles || []).map(({ _isNew: _e, ...e }) => ({
              ...e,
              echelons: (e.echelons || []).map(({ _isNew: _ec, ...ec }) => ec)
            }))
          }))
        }))
      };
      await api.post('/api/gestionEtat/store', payload);
      setIsDataSaved(true);
      setHasUnsavedChanges(false);
      showNotification(`Configuration ${config.year} sauvegardée !`, 'success');
      await fetchYearData();
    } catch { showNotification('Erreur de sauvegarde', 'error'); }
    finally { setLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────
  //  exportToPDF — exporte la grille salariale en PDF (blob)
  // ─────────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    if (config.year < 1900 || config.year > 2200) { showNotification('Année invalide', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/api/gestionEtat/export-pdf/${config.year}`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `grille_salariale_${config.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification('PDF exporté !', 'success');
    } catch { showNotification('Erreur export PDF', 'error'); }
    finally { setLoading(false); }
  };

  // ── Définition des cartes de statistiques ──
  const statsCards = [
    { title: 'Postes',          value: config.Post.length,        icon: Users,      accent: 'indigo'  },
    { title: 'Grades',          value: totalGrades,               icon: Layers,     accent: 'emerald' },
    { title: 'Échelles',        value: totalEchelles,             icon: Grid3x3,    accent: 'violet'  },
    { title: 'Échelons',        value: totalEchelons,             icon: Database,   accent: 'amber'   },
    { title: 'Masse salariale', value: totalSalary.toLocaleString(), icon: DollarSign, accent: 'rose' },
  ];

  // ════════════════════════════════════════════════════════════
  //  Rendu principal
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.page}`}>
      <div className=" max-w-[1600px] mx-auto">

        {/* ────── En-tête ────── */}
        <div className="mb-8 pt-2">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              {/* Bouton retour */}
              <button
                onClick={() => navigate(-1)}
                className={`cursor-pointer p-2.5 rounded-2xl border ${t.card} shadow-sm hover:shadow-md transition-all`}
                title="Retour"
              >
                <ArrowLeft size={16} className={t.text}/>
              </button>
              <div>
                <h1 className={`text-xl font-black tracking-tight ${t.text}`}>Grille des Salaires</h1>
                <p className={`text-[11px] ${t.textMuted} mt-0.5`}>Postes · Grades · Échelles · Échelons</p>
              </div>
            </div>
          </div>

          {/* Cartes stats — cachées si modifications en cours */}
          {isDataSaved && !hasUnsavedChanges && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {statsCards.map((s, i) => (
                <StatCard key={i} {...s} dark={dark}/>
              ))}
            </div>
          )}

          {/* Bannière avertissement modifications non sauvegardées */}
          {(!isDataSaved || hasUnsavedChanges) && (
            <div className={`${t.card} border rounded-2xl p-4 mb-6 flex items-center gap-3`}>
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertCircle size={16} className="text-amber-500"/>
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {config.Post.length === 0 ? 'Commencez par créer un poste' : 'Modifications non sauvegardées'}
                </p>
                <p className={`text-[10px] ${t.textMuted}`}>
                  {config.Post.length === 0 ? "Cliquez sur '+ Nouveau Poste'" : 'Les statistiques s\'affichent après sauvegarde'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ────── Barre de contrôles ────── */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {/* Sélecteur d'année */}
            <YearControl
              year={config.year}
              dark={dark}
              onChange={(e) => {
                const raw = e.target.value;
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                setIsTyping(true);
                const yr = parseInt(raw);
                setConfig({ ...config, year: isNaN(yr) ? '' : yr });
                setIsDataSaved(false);
                setHasUnsavedChanges(true);
                setSelectedPostId(null);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
              }}
              onUp={()    => changeYear(1)}
              onDown={()  => changeYear(-1)}
              onBlur={()  => setIsTyping(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); setIsTyping(false); } }}
            />

            <PrimaryButton onClick={addPost}      icon={Plus}     label="Nouveau Poste" color="blue"/>
            <PrimaryButton onClick={exportToPDF}  icon={FileText} label="Export PDF"    color="red"
              disabled={loading || config.Post.length === 0}/>
          </div>

          {/* Bouton sauvegarder */}
          <PrimaryButton
            onClick={handleSave}
            disabled={loading || !hasUnsavedChanges}
            icon={Save}
            label={!hasUnsavedChanges ? 'Sauvegardé' : `Sauvegarder ${config.year}`}
            color={!hasUnsavedChanges ? 'gray' : 'indigo'}
            loading={loading}
          />
        </div>

        {/* ────── Liste des postes ────── */}
        <div className="space-y-3">
          {config.Post.map((post, pIdx) => (
            <PostCard
              key={post.id}
              post={post} pIdx={pIdx}
              dark={dark} config={config} setConfig={setConfig}
              compactView={compactView} hasUnsavedChanges={hasUnsavedChanges}
              copiedIndex={copiedIndex} deleting={deleting}
              postStarred={postStarred} loading={loading}
              selectedPostId={selectedPostId} setSelectedPostId={setSelectedPostId}
              addGrade={addGrade} addEchelle={addEchelle} addEchelon={addEchelon}
              duplicateEchelon={duplicateEchelon} togglePostStar={togglePostStar}
              deletePostLocal={deletePostLocal} handleDeletePost={handleDeletePost}
              deleteGradeLocal={deleteGradeLocal} handleDeleteGrade={handleDeleteGrade}
              deleteEchelleLocal={deleteEchelleLocal} handleDeleteEchelle={handleDeleteEchelle}
              deleteEchelonLocal={deleteEchelonLocal} handleDeleteEchelon={handleDeleteEchelon}
            />
          ))}

          {/* Placeholder si aucun poste */}
          {config.Post.length === 0 && !loading && (
            <div className={`text-center py-20 border-2 border-dashed rounded-2xl ${t.border} ${dark ? 'bg-[#141416] text-gray-500' : 'bg-white text-gray-400'}`}>
              <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 ${dark ? 'bg-[#232329]' : 'bg-gray-50'} flex items-center justify-center`}>
                <Database size={28} className="opacity-40"/>
              </div>
              <p className="font-semibold text-sm mb-1">Aucune configuration pour {config.year}</p>
              <p className={`text-[11px] ${t.textMuted} mb-4`}>Créez votre premier poste pour commencer</p>
              <button
                onClick={addPost}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                + Créer un poste
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pill flottant modifications non sauvegardées ── */}
      {hasUnsavedChanges && !loading && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-xl text-[10px] font-bold flex items-center gap-2 animate-pulse">
          <Sparkles size={11} className="animate-spin"/>
          Modifications non sauvegardées
        </div>
      )}

      {/* ── Modale de confirmation de suppression ── */}
      <DeleteConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        darkMode={dark}
      />
    </div>
  );
};

export default GestionEtat;