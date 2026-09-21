import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BUILDING_TYPE_LABELS,
  INTAKE_HELP,
  POWER_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  UNKNOWN_GUIDANCE,
} from '../constants/marketplace';
import { marketplaceService } from '../services';
import type { BuildingType, IntakeMeasurement, JobIntake as JobIntakeData, PowerType, ProjectStage, ProjectType } from '../types';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

type MeasurementKey = keyof JobIntakeData;

const initialIntake: JobIntakeData = {
  kvaRating: { unknown: true },
  floorAreaSqm: { unknown: true },
  breakerCount: { unknown: true },
  panelCount: { unknown: true },
  storeys: { unknown: true },
};

function IntakeField({
  id,
  measurement,
  onChange,
}: {
  id: MeasurementKey;
  measurement: IntakeMeasurement;
  onChange: (next: IntakeMeasurement) => void;
}) {
  const help = INTAKE_HELP[id];
  return (
    <label className="field help-field">
      {help.label}
      <input
        type="number"
        min="0"
        value={measurement.value ?? ''}
        disabled={measurement.unknown || measurement.notApplicable}
        onChange={(event) =>
          onChange({ unknown: false, value: event.target.value ? Number(event.target.value) : undefined })
        }
      />
      <span className="help-text">{help.help}</span>
      <span className="check-row">
        <input
          type="checkbox"
          checked={measurement.unknown}
          disabled={measurement.notApplicable}
          onChange={(event) => onChange({ unknown: event.target.checked, notApplicable: false, value: event.target.checked ? undefined : 0 })}
        />
        I do not know yet
      </span>
      <span className="check-row">
        <input
          type="checkbox"
          checked={measurement.notApplicable ?? false}
          onChange={(event) => onChange({ unknown: false, notApplicable: event.target.checked, value: event.target.checked ? undefined : 0 })}
        />
        N/A for this project
      </span>
      {measurement.unknown ? <span className="help-text">{UNKNOWN_GUIDANCE}</span> : null}
    </label>
  );
}

export function JobIntake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [projectType] = useState<ProjectType>('design_plan');
  const [projectTypeOther, setProjectTypeOther] = useState('');
  const [scopeTypes, setScopeTypes] = useState<ProjectType[]>(['design_plan']);
  const [projectStatus, setProjectStatus] = useState<ProjectStage>('new_construction');
  const [buildingType, setBuildingType] = useState<BuildingType>('commercial');
  const [powerType, setPowerType] = useState<PowerType>('not_sure');
  const [location, setLocation] = useState(user?.location ?? '');
  const [budgetMin, setBudgetMin] = useState('25000');
  const [budgetMax, setBudgetMax] = useState('50000');
  const [scope, setScope] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('');
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [intake, setIntake] = useState<JobIntakeData>(initialIntake);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateMeasurement = (key: MeasurementKey, next: IntakeMeasurement) => {
    setIntake((current) => ({ ...current, [key]: next }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const job = await marketplaceService.createJob(user.id, {
        title,
        projectType: scopeTypes[0] ?? projectType,
        projectTypeOther,
        scopeTypes,
        projectStatus,
        buildingType,
        powerType,
        location,
        targetTimeline,
        supportingFiles,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        scope,
        intake,
      });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setSupportingFiles(Array.from(event.target.files ?? []).map((file) => file.name));
  };

  const toggleScope = (scope: ProjectType) => {
    setScopeTypes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  };

  return (
    <main className="page narrow-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Structured intake</p>
          <h1>Post an EE job</h1>
          <p className="muted">The form captures enough context for designers to price and respond responsibly.</p>
        </div>
      </section>

      <form className="card stack" onSubmit={handleSubmit}>
        <fieldset className="intake-section">
          <legend>1. Basic project details</legend>
          <label className="field">
            Job title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <div className="grid two">
          <label className="field">
            Project status
            <select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as ProjectStage)}>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field">
            Building type
            <select value={buildingType} onChange={(event) => setBuildingType(event.target.value as BuildingType)}>
              {Object.entries(BUILDING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          </div>
          <div className="grid two">
            <IntakeField id="floorAreaSqm" measurement={intake.floorAreaSqm} onChange={(next) => updateMeasurement('floorAreaSqm', next)} />
            <IntakeField id="storeys" measurement={intake.storeys} onChange={(next) => updateMeasurement('storeys', next)} />
          </div>
        </fieldset>

        <fieldset className="intake-section">
          <legend>2. Electrical specifics</legend>
          <div className="intake-grid">
            <IntakeField id="kvaRating" measurement={intake.kvaRating} onChange={(next) => updateMeasurement('kvaRating', next)} />
            <IntakeField id="breakerCount" measurement={intake.breakerCount} onChange={(next) => updateMeasurement('breakerCount', next)} />
            <IntakeField id="panelCount" measurement={intake.panelCount} onChange={(next) => updateMeasurement('panelCount', next)} />
          </div>
          <label className="field">
            Power type
            <select value={powerType} onChange={(event) => setPowerType(event.target.value as PowerType)}>
              {Object.entries(POWER_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <span className="help-text">Choose “Not sure” if you need an engineer to confirm it.</span>
          </label>
        </fieldset>

        <fieldset className="intake-section">
          <legend>3. Scope of work</legend>
          <div className="scope-options">
            {(['design_plan', 'load_calculation', 'sign_seal', 'installation', 'other'] as ProjectType[]).map((scope) => (
              <label className="check-row" key={scope}>
                <input type="checkbox" checked={scopeTypes.includes(scope)} onChange={() => toggleScope(scope)} />
                {PROJECT_TYPE_LABELS[scope]}
              </label>
            ))}
          </div>
          {scopeTypes.includes('other') ? (
            <label className="field">
              Specify other scope
              <input value={projectTypeOther} onChange={(event) => setProjectTypeOther(event.target.value)} placeholder="e.g. Energy audit" required />
            </label>
          ) : null}
          <span className="help-text">Select every part of the work you need. Engineers use these selections to respond with the right scope.</span>
        </fieldset>

        <fieldset className="intake-section">
          <legend>4. Logistics</legend>
          <label className="field">
            Project location (city/province)
            <input value={location} onChange={(event) => setLocation(event.target.value)} required />
          </label>
          <label className="field">
            Minimum budget
            <input type="number" min="0" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} />
          </label>
          <label className="field">
            Maximum budget
            <input type="number" min="0" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} />
          </label>
          <label className="field">
            Target timeline
            <input value={targetTimeline} onChange={(event) => setTargetTimeline(event.target.value)} placeholder="e.g. Within 3 weeks" required />
          </label>
          <label className="field">
            Supporting files
            <input type="file" multiple accept="image/*,.pdf" onChange={handleFiles} />
            <span className="help-text">Floor plans, existing bills, and photos.</span>
            {supportingFiles.length > 0 ? <span className="help-text">Selected: {supportingFiles.join(', ')}</span> : null}
          </label>
          <label className="field">
            Scope notes
            <textarea value={scope} onChange={(event) => setScope(event.target.value)} rows={5} required />
          </label>
        </fieldset>

        {error ? <div className="alert error">{error}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Posting...' : 'Post job'}
        </button>
      </form>
    </main>
  );
}
