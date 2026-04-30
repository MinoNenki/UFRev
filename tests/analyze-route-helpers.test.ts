import { describe, expect, it } from 'vitest';
import { buildDirectQuestionLead, detectIntent, isServiceBusinessPrompt, normalizeAnalysisProfile } from '@/lib/analyze-helpers';

describe('analyze route helpers', () => {
  it('treats Polish units-price-demand questions as profit intent', () => {
    const question = 'Ile sztuk kupić najlepiej żeby było to opłacalne i po ile wystawiać na allegro oraz czy będzie na to popyt';
    expect(detectIntent(question)).toBe('calculate_profit');
  });

  it('builds a direct lead for supplier-to-Allegro resale questions', () => {
    const lead = buildDirectQuestionLead({
      content: 'Ile sztuk kupić i po ile wystawiać na Allegro oraz czy będzie popyt?',
      currentLanguage: 'pl',
      displayCurrency: 'PLN',
      websiteUrl: 'https://www.alibaba.com/product-detail/example.html',
      salesChannel: 'Allegro',
      price: 0,
      cost: 0,
    });

    expect(lead).toMatch(/20–50 sztuk|20-50 sztuk/i);
    expect(lead).toMatch(/Allegro/i);
  });

  it('adds fast-payback rental guidance when the user asks about renting', () => {
    const lead = buildDirectQuestionLead({
      content: 'Czy lepiej to wynajmować i jakie dać stawki żeby szybko się zwróciło?',
      currentLanguage: 'pl',
      displayCurrency: 'PLN',
      websiteUrl: 'https://www.alibaba.com/product-detail/example.html',
      salesChannel: 'Polska / wynajem',
      price: 0,
      cost: 4800,
    });

    expect(lead).toMatch(/wynajem|wypożycz/i);
    expect(lead).toMatch(/8–12|8-12/i);
    expect(lead).toMatch(/PLN|zł/i);
  });

  it('detects a local service-business research prompt with competitor links', () => {
    const prompt = 'Chcę otworzyć myjnię parową, myjnię TIR i mobilną myjnię aut. Podaj jaki sprzęt będzie potrzebny, ile to będzie kosztowało i czy warto w kujawsko-pomorskim. https://ktc-truck.pl/myjnia-tir';
    expect(isServiceBusinessPrompt(prompt)).toBe(true);
  });

  it('builds a service-focused lead for local washing business questions', () => {
    const lead = buildDirectQuestionLead({
      content: 'Chcę otworzyć myjnię parową i mobilną. Jaki sprzęt będzie potrzebny, ile to będzie kosztowało i w jaki kierunek iść?',
      currentLanguage: 'pl',
      displayCurrency: 'PLN',
      websiteUrl: 'https://ktc-truck.pl/myjnia-tir',
      salesChannel: 'woj. kujawsko-pomorskie',
      price: 0,
      cost: 0,
    });

    expect(lead).toMatch(/niszę premium|jedną niszę premium/i);
    expect(lead).toMatch(/auta roboczego|parownicy|myjki/i);
    expect(lead).toMatch(/cenników lokalnych|benchmark usług/i);
  });

  it('normalizes a missing profile to safe free-plan defaults', () => {
    expect(normalizeAnalysisProfile(null)).toEqual({
      credits_balance: 3,
      analyses_used_this_month: 0,
      monthly_analysis_limit: 3,
      role: 'user',
      plan_key: 'free',
    });
  });
});
