import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { OGDialog, OGDialogContent, OGDialogDescription, OGDialogTitle } from '@librechat/client';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Code2,
  Database,
  FileText,
  GraduationCap,
  Layers,
  Menu,
  MessageSquare,
  Microscope,
  Network,
  Palette,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKeys } from '~/hooks';
import { useGetStartupConfig } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import faceImage from './assets/semar-face.png';
import heroImage from './assets/semar-hero.png';
import { useLocalize } from '~/hooks';
import './landing.css';

type NavItem = { href: string; key: TranslationKeys };
type IconCard = { icon: LucideIcon; titleKey: TranslationKeys; descKey: TranslationKeys };
type FeatureCard = IconCard & { id: string };
type AgentCard = IconCard & { nameKey: TranslationKeys; linkKey: TranslationKeys };

const navItems: NavItem[] = [
  { href: '#home', key: 'com_landing_nav_home' },
  { href: '#fitur', key: 'com_landing_nav_features' },
  { href: '#use-case', key: 'com_landing_nav_usecases' },
  { href: '#agen', key: 'com_landing_nav_agents' },
];

const heroChips: { href: string; key: TranslationKeys; icon: LucideIcon }[] = [
  { href: '#fitur-chat', key: 'com_landing_chip_chat', icon: MessageSquare },
  { href: '#fitur-agen', key: 'com_landing_chip_agents', icon: Bot },
  { href: '#fitur-rag', key: 'com_landing_chip_rag', icon: BookOpen },
  { href: '#fitur-dokumen', key: 'com_landing_chip_docs', icon: Database },
  { href: '#fitur-konteks', key: 'com_landing_chip_context', icon: Sparkles },
];

const benefits: IconCard[] = [
  {
    icon: Zap,
    titleKey: 'com_landing_benefit_productive_title',
    descKey: 'com_landing_benefit_productive_desc',
  },
  {
    icon: ShieldCheck,
    titleKey: 'com_landing_benefit_secure_title',
    descKey: 'com_landing_benefit_secure_desc',
  },
  {
    icon: Layers,
    titleKey: 'com_landing_benefit_local_title',
    descKey: 'com_landing_benefit_local_desc',
  },
  {
    icon: Network,
    titleKey: 'com_landing_benefit_flexible_title',
    descKey: 'com_landing_benefit_flexible_desc',
  },
  {
    icon: BarChart3,
    titleKey: 'com_landing_benefit_impact_title',
    descKey: 'com_landing_benefit_impact_desc',
  },
];

const features: FeatureCard[] = [
  {
    id: 'fitur-chat',
    icon: MessageSquare,
    titleKey: 'com_landing_feature_chat_title',
    descKey: 'com_landing_feature_chat_desc',
  },
  {
    id: 'fitur-agen',
    icon: Bot,
    titleKey: 'com_landing_feature_agents_title',
    descKey: 'com_landing_feature_agents_desc',
  },
  {
    id: 'fitur-rag',
    icon: BookOpen,
    titleKey: 'com_landing_feature_rag_title',
    descKey: 'com_landing_feature_rag_desc',
  },
  {
    id: 'fitur-dokumen',
    icon: Database,
    titleKey: 'com_landing_feature_docs_title',
    descKey: 'com_landing_feature_docs_desc',
  },
  {
    id: 'fitur-konteks',
    icon: Sparkles,
    titleKey: 'com_landing_feature_context_title',
    descKey: 'com_landing_feature_context_desc',
  },
  {
    id: 'fitur-skills',
    icon: Code2,
    titleKey: 'com_landing_feature_skills_title',
    descKey: 'com_landing_feature_skills_desc',
  },
  {
    id: 'fitur-memori',
    icon: Brain,
    titleKey: 'com_landing_feature_memories_title',
    descKey: 'com_landing_feature_memories_desc',
  },
  {
    id: 'fitur-jadwal',
    icon: CalendarClock,
    titleKey: 'com_landing_feature_schedules_title',
    descKey: 'com_landing_feature_schedules_desc',
  },
];

const useCases: IconCard[] = [
  {
    icon: Building2,
    titleKey: 'com_landing_usecase_government_title',
    descKey: 'com_landing_usecase_government_desc',
  },
  {
    icon: Briefcase,
    titleKey: 'com_landing_usecase_business_title',
    descKey: 'com_landing_usecase_business_desc',
  },
  {
    icon: GraduationCap,
    titleKey: 'com_landing_usecase_education_title',
    descKey: 'com_landing_usecase_education_desc',
  },
  {
    icon: Palette,
    titleKey: 'com_landing_usecase_creative_title',
    descKey: 'com_landing_usecase_creative_desc',
  },
  {
    icon: Code2,
    titleKey: 'com_landing_usecase_engineering_title',
    descKey: 'com_landing_usecase_engineering_desc',
  },
  {
    icon: Microscope,
    titleKey: 'com_landing_usecase_research_title',
    descKey: 'com_landing_usecase_research_desc',
  },
];

const agents: AgentCard[] = [
  {
    icon: Code2,
    nameKey: 'com_landing_agent_proto_name',
    titleKey: 'com_landing_agent_proto_title',
    descKey: 'com_landing_agent_proto_desc',
    linkKey: 'com_landing_agent_proto_link',
  },
  {
    icon: Palette,
    nameKey: 'com_landing_agent_sable_name',
    titleKey: 'com_landing_agent_sable_title',
    descKey: 'com_landing_agent_sable_desc',
    linkKey: 'com_landing_agent_sable_link',
  },
  {
    icon: Search,
    nameKey: 'com_landing_agent_seo_name',
    titleKey: 'com_landing_agent_seo_title',
    descKey: 'com_landing_agent_seo_desc',
    linkKey: 'com_landing_agent_seo_link',
  },
  {
    icon: Video,
    nameKey: 'com_landing_agent_video_name',
    titleKey: 'com_landing_agent_video_title',
    descKey: 'com_landing_agent_video_desc',
    linkKey: 'com_landing_agent_video_link',
  },
  {
    icon: BookOpen,
    nameKey: 'com_landing_agent_cooper_name',
    titleKey: 'com_landing_agent_cooper_title',
    descKey: 'com_landing_agent_cooper_desc',
    linkKey: 'com_landing_agent_cooper_link',
  },
  {
    icon: ShieldCheck,
    nameKey: 'com_landing_agent_audit_name',
    titleKey: 'com_landing_agent_audit_title',
    descKey: 'com_landing_agent_audit_desc',
    linkKey: 'com_landing_agent_audit_link',
  },
  {
    icon: Bot,
    nameKey: 'com_landing_agent_engineer_name',
    titleKey: 'com_landing_agent_engineer_title',
    descKey: 'com_landing_agent_engineer_desc',
    linkKey: 'com_landing_agent_engineer_link',
  },
  {
    icon: BarChart3,
    nameKey: 'com_landing_agent_adspend_name',
    titleKey: 'com_landing_agent_adspend_title',
    descKey: 'com_landing_agent_adspend_desc',
    linkKey: 'com_landing_agent_adspend_link',
  },
  {
    icon: Check,
    nameKey: 'com_landing_agent_qa_name',
    titleKey: 'com_landing_agent_qa_title',
    descKey: 'com_landing_agent_qa_desc',
    linkKey: 'com_landing_agent_qa_link',
  },
  {
    icon: Sparkles,
    nameKey: 'com_landing_agent_asa_name',
    titleKey: 'com_landing_agent_asa_title',
    descKey: 'com_landing_agent_asa_desc',
    linkKey: 'com_landing_agent_asa_link',
  },
];

function SectionHead({
  eyebrowKey,
  titleKey,
  descKey,
}: {
  eyebrowKey: TranslationKeys;
  titleKey: TranslationKeys;
  descKey: TranslationKeys;
}) {
  const localize = useLocalize();
  return (
    <div className="semar-section__head">
      <span className="semar-eyebrow">{localize(eyebrowKey)}</span>
      <h2 className="semar-section__title">{localize(titleKey)}</h2>
      <p className="semar-section__desc">{localize(descKey)}</p>
    </div>
  );
}

function DemoDialog({
  open,
  onOpenChange,
  registrationTarget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationTarget: string;
}) {
  const localize = useLocalize();
  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="semar-demo" overlayClassName="semar-demo-overlay">
        <div className="semar-demo__body">
          <OGDialogTitle className="semar-demo__title">
            {localize('com_landing_demo_title')}
          </OGDialogTitle>
          <OGDialogDescription className="semar-demo__desc">
            {localize('com_landing_demo_desc')}
          </OGDialogDescription>

          <div className="semar-demo__chat" aria-live="polite">
            <div className="semar-demo__msg semar-demo__msg--user">
              <span className="semar-demo__avatar semar-demo__avatar--user">
                {localize('com_landing_demo_you')}
              </span>
              <p>{localize('com_landing_demo_user')}</p>
            </div>
            <div className="semar-demo__msg semar-demo__msg--assistant">
              <span className="semar-demo__avatar semar-demo__avatar--brand">
                <img src={faceImage} alt="" aria-hidden="true" />
              </span>
              <div>
                <p>{localize('com_landing_demo_assistant')}</p>
                <ul>
                  <li>{localize('com_landing_demo_point1')}</li>
                  <li>{localize('com_landing_demo_point2')}</li>
                  <li>{localize('com_landing_demo_point3')}</li>
                </ul>
                <span className="semar-demo__source">
                  <FileText size={14} aria-hidden="true" />
                  {localize('com_landing_demo_source')}
                </span>
              </div>
            </div>
          </div>

          <p className="semar-demo__note">{localize('com_landing_demo_note')}</p>
          <div className="semar-demo__actions">
            <Link
              className="semar-btn semar-btn--primary"
              to={registrationTarget}
              onClick={() => onOpenChange(false)}
            >
              {localize(
                registrationTarget === '/register' ? 'com_landing_demo_cta' : 'com_landing_login',
              )}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="semar-btn semar-btn--outline"
              onClick={() => onOpenChange(false)}
            >
              {localize('com_landing_demo_close')}
            </button>
          </div>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}

export default function LandingPage() {
  const localize = useLocalize();
  const { isAuthenticated, isAuthReady } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const appTitle = startupConfig?.appTitle ?? 'SEMAR-GPT';
  const registrationEnabled = startupConfig?.registrationEnabled !== false;
  const registrationTarget = registrationEnabled ? '/register' : '/login';

  useEffect(() => {
    document.documentElement.classList.add('semar-landing-root');
    return () => {
      document.documentElement.classList.remove('semar-landing-root');
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${appTitle} — AI untuk Indonesia`;
    return () => {
      document.title = previousTitle;
    };
  }, [appTitle]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  if (!isAuthReady) {
    return (
      <div className="semar-landing semar-landing--loading" aria-busy="true">
        <img src={faceImage} alt="" className="semar-loading__mark" aria-hidden="true" />
        <p>{localize('com_landing_loading')}</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/c/new" replace />;
  }

  return (
    <div className="semar-landing">
      <a className="semar-skip" href="#main">
        {localize('com_landing_skip')}
      </a>

      <header className="semar-header">
        <div className="semar-container semar-header__inner">
          <a className="semar-brand" href="#home" aria-label={localize('com_landing_home_label')}>
            <img src={faceImage} alt="" className="semar-brand__mark" aria-hidden="true" />
            <span>{appTitle}</span>
          </a>

          <nav className="semar-nav" aria-label={localize('com_landing_aria_primary_nav')}>
            {navItems.map((item, index) => (
              <a key={item.key} href={item.href} aria-current={index === 0 ? 'page' : undefined}>
                {localize(item.key)}
              </a>
            ))}
          </nav>

          <div className="semar-header__actions">
            <Link className="semar-btn semar-btn--ghost" to="/login">
              {localize('com_landing_login')}
            </Link>
            {registrationEnabled && (
              <Link className="semar-btn semar-btn--primary" to={registrationTarget}>
                {localize('com_landing_register')}
              </Link>
            )}
          </div>

          <button
            type="button"
            className="semar-menu-btn"
            aria-label={
              menuOpen ? localize('com_landing_close_menu') : localize('com_landing_open_menu')
            }
            aria-expanded={menuOpen}
            aria-controls="semar-mobile-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <div id="semar-mobile-nav" className="semar-mobile-nav">
            <nav aria-label={localize('com_landing_aria_mobile_nav')}>
              {navItems.map((item) => (
                <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)}>
                  {localize(item.key)}
                </a>
              ))}
            </nav>
            <div className="semar-mobile-nav__actions">
              <Link
                className="semar-btn semar-btn--ghost"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                {localize('com_landing_login')}
              </Link>
              {registrationEnabled && (
                <Link
                  className="semar-btn semar-btn--primary"
                  to={registrationTarget}
                  onClick={() => setMenuOpen(false)}
                >
                  {localize('com_landing_register')}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main">
        <section id="home" className="semar-hero">
          <div className="semar-container semar-hero__grid">
            <div className="semar-hero__copy">
              <span className="semar-badge">
                <span className="semar-flag" aria-hidden="true" />
                {localize('com_landing_badge')}
              </span>
              <h1 className="semar-hero__title">{appTitle}</h1>
              <p className="semar-hero__subtitle">{localize('com_landing_subtitle')}</p>
              <p className="semar-hero__desc">{localize('com_landing_description')}</p>
              <div className="semar-hero__actions">
                <Link
                  className="semar-btn semar-btn--primary semar-btn--lg"
                  to={registrationTarget}
                >
                  {localize('com_landing_cta_primary')}
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="semar-btn semar-btn--outline semar-btn--lg"
                  onClick={() => setDemoOpen(true)}
                >
                  <Play size={18} aria-hidden="true" />
                  {localize('com_landing_cta_demo')}
                </button>
              </div>
              <p className="semar-hero__note">{localize('com_landing_hero_note')}</p>
            </div>

            <div className="semar-hero__visual">
              <div className="semar-hero__glow" aria-hidden="true" />
              <img
                src={heroImage}
                alt={localize('com_landing_hero_alt')}
                className="semar-hero__image"
              />
              <div className="semar-hero__chips">
                {heroChips.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <a key={chip.key} className="semar-chip" href={chip.href}>
                      <Icon size={20} aria-hidden="true" />
                      {localize(chip.key)}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="semar-benefits" aria-labelledby="semar-benefits-title">
          <div className="semar-container">
            <h2 id="semar-benefits-title" className="semar-sr-only">
              {localize('com_landing_benefits_title')}
            </h2>
            <div className="semar-benefits__grid">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.titleKey} className="semar-benefit">
                    <span className="semar-benefit__icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>{localize(benefit.titleKey)}</h3>
                    <p>{localize(benefit.descKey)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="fitur" className="semar-section">
          <div className="semar-container">
            <SectionHead
              eyebrowKey="com_landing_features_eyebrow"
              titleKey="com_landing_features_title"
              descKey="com_landing_features_desc"
            />
            <div className="semar-feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.id} id={feature.id} className="semar-card">
                    <span className="semar-card__icon">
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <h3>{localize(feature.titleKey)}</h3>
                    <p>{localize(feature.descKey)}</p>
                    <Link className="semar-card__link" to={registrationTarget}>
                      {localize('com_landing_feature_cta')}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="use-case" className="semar-section semar-section--alt">
          <div className="semar-container">
            <SectionHead
              eyebrowKey="com_landing_usecases_eyebrow"
              titleKey="com_landing_usecases_title"
              descKey="com_landing_usecases_desc"
            />
            <div className="semar-usecase-grid">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <article key={useCase.titleKey} className="semar-card semar-card--usecase">
                    <span className="semar-card__icon">
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <h3>{localize(useCase.titleKey)}</h3>
                    <p>{localize(useCase.descKey)}</p>
                  </article>
                );
              })}
            </div>
            <div className="semar-section__cta">
              <Link className="semar-btn semar-btn--outline" to={registrationTarget}>
                {localize('com_landing_usecases_cta')}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="agen" className="semar-section">
          <div className="semar-container">
            <SectionHead
              eyebrowKey="com_landing_agents_eyebrow"
              titleKey="com_landing_agents_title"
              descKey="com_landing_agents_desc"
            />
            <div className="semar-agent-grid">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <article key={agent.nameKey} className="semar-agent">
                    <span className="semar-agent__icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div className="semar-agent__body">
                      <span className="semar-agent__name">{localize(agent.nameKey)}</span>
                      <h3>{localize(agent.titleKey)}</h3>
                      <p>{localize(agent.descKey)}</p>
                      <Link className="semar-card__link" to={registrationTarget}>
                        {localize(agent.linkKey)}
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="semar-section__cta">
              <Link className="semar-btn semar-btn--outline" to={registrationTarget}>
                {localize('com_landing_agents_cta')}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="semar-cta">
          <div className="semar-container">
            <div className="semar-cta__card">
              <span className="semar-cta__spark" aria-hidden="true">
                <Sparkles size={26} />
              </span>
              <h2>{localize('com_landing_cta_title')}</h2>
              <p>{localize('com_landing_cta_desc')}</p>
              <div className="semar-cta__actions">
                <Link
                  className="semar-btn semar-btn--primary semar-btn--lg"
                  to={registrationTarget}
                >
                  {localize('com_landing_cta_register')}
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <Link className="semar-btn semar-btn--outline semar-btn--lg" to="/login">
                  {localize('com_landing_cta_login')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="semar-footer">
        <div className="semar-container">
          <div className="semar-footer__grid">
            <div className="semar-footer__brand">
              <a className="semar-brand" href="#home">
                <img src={faceImage} alt="" className="semar-brand__mark" aria-hidden="true" />
                <span>{appTitle}</span>
              </a>
              <p>{localize('com_landing_footer_tagline')}</p>
            </div>

            <div>
              <h3>{localize('com_landing_footer_product')}</h3>
              <ul>
                <li>
                  <a href="#fitur">{localize('com_landing_nav_features')}</a>
                </li>
                <li>
                  <a href="#agen">{localize('com_landing_nav_agents')}</a>
                </li>
                <li>
                  <Link to="/login">{localize('com_landing_login')}</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="semar-footer__bottom">
            <span>{localize('com_landing_footer_rights')}</span>
            <span>{localize('com_landing_footer_built')}</span>
          </div>
        </div>
      </footer>

      <DemoDialog
        open={demoOpen}
        onOpenChange={setDemoOpen}
        registrationTarget={registrationTarget}
      />
    </div>
  );
}
