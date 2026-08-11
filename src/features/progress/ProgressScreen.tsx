// ============================================================================
// ProgressScreen — zakładka "Postępy": waga (A1), woda (A2), kalendarz
// posiłków (A3), osiągnięcia (A4) i pomiary ciała (A5).
// ============================================================================

import { WeightSection } from './components/WeightSection';
import { WaterSection } from './components/WaterSection';
import { CalendarSection } from './components/CalendarSection';
import { AchievementsSection } from './components/AchievementsSection';
import { MeasurementsSection } from './components/MeasurementsSection';

export default function ProgressScreen(): JSX.Element {
  return (
    <section className="space-y-6 p-4">
      <WeightSection />
      <WaterSection />
      <CalendarSection />
      <AchievementsSection />
      <MeasurementsSection />
    </section>
  );
}
