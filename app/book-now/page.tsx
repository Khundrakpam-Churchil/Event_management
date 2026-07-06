"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles, Ticket, Users } from "lucide-react";
import { useState } from "react";

const ticketPlans = [
  {
    id: "standard",
    name: "Standard",
    price: "$49",
    note: "Great value for casual attendees",
    perks: ["General admission", "Entry to lounge", "Digital ticket"],
  },
  {
    id: "vip",
    name: "VIP",
    price: "$89",
    note: "Premium access with fast-track entry",
    perks: ["Priority seating", "Exclusive merch", "Early arrival"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$129",
    note: "Best-in-class experience for fans",
    perks: ["Front-row zone", "Meet & greet", "Complimentary drink"],
  },
];

const timingOptions = [
  { id: "early", label: "6:30 PM", hint: "Warm-up access" },
  { id: "main", label: "8:00 PM", hint: "Main show" },
  { id: "late", label: "10:30 PM", hint: "Late-night encore" },
];

const priceOptions = [
  { id: "budget", label: "Budget", hint: "Under $60" },
  { id: "mid", label: "Mid", hint: "$60 - $100" },
  { id: "luxury", label: "Luxury", hint: "Above $100" },
];

const areaOptions = [
  { id: "balcony", label: "Balcony", hint: "Elevated view" },
  { id: "orchestra", label: "Orchestra", hint: "Center stage" },
  { id: "vip-area", label: "VIP Area", hint: "Closest to the action" },
];

export default function BookNowPage() {
  const [selectedPlan, setSelectedPlan] = useState("vip");
  const [selectedTiming, setSelectedTiming] = useState("main");
  const [selectedPrice, setSelectedPrice] = useState("mid");
  const [selectedArea, setSelectedArea] = useState("orchestra");

  const activePlan = ticketPlans.find((plan) => plan.id === selectedPlan) ?? ticketPlans[0];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200 backdrop-blur">
              <Ticket className="h-4 w-4" />
              Accessible booking experience
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose your ticket, time, budget, and seat area in one place.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              This demo page makes the booking flow easier to understand with clearly grouped pricing, timing, and seating choices.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Back to showcase
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              <Sparkles className="h-4 w-4" />
              Ticket prices
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {ticketPlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <label
                    key={plan.id}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ticket-plan"
                      value={plan.id}
                      checked={isSelected}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                      <span className="text-sm font-semibold text-slate-700">{plan.price}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{plan.note}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-500" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <legend className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Timing options
              </legend>
              <div className="mt-4 space-y-3">
                {timingOptions.map((option) => {
                  const isSelected = selectedTiming === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="timing"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedTiming(option.id)}
                        className="sr-only"
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{option.label}</span>
                        <span className="text-sm text-slate-500">{option.hint}</span>
                      </span>
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <legend className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Price range
              </legend>
              <div className="mt-4 space-y-3">
                {priceOptions.map((option) => {
                  const isSelected = selectedPrice === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="price"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedPrice(option.id)}
                        className="sr-only"
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{option.label}</span>
                        <span className="text-sm text-slate-500">{option.hint}</span>
                      </span>
                      <span className="text-sm font-semibold text-cyan-600">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Seat area
            </legend>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {areaOptions.map((option) => {
                const isSelected = selectedArea === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border p-4 text-center transition ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="area"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedArea(option.id)}
                      className="sr-only"
                    />
                    <MapPin className="mx-auto h-5 w-5 text-slate-500" />
                    <span className="mt-2 block font-medium text-slate-900">{option.label}</span>
                    <span className="text-sm text-slate-500">{option.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/20">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            <Users className="h-4 w-4" />
            Your selection
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-sm text-slate-300">Selected plan</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-xl font-semibold">{activePlan.name}</p>
                <p className="text-sm text-slate-400">{activePlan.price}</p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-medium text-cyan-200">
                {activePlan.price}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Timing</span>
              <span className="font-medium text-white">
                {timingOptions.find((item) => item.id === selectedTiming)?.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Price range</span>
              <span className="font-medium text-white">
                {priceOptions.find((item) => item.id === selectedPrice)?.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Seat area</span>
              <span className="font-medium text-white">
                {areaOptions.find((item) => item.id === selectedArea)?.label}
              </span>
            </div>
          </div>

          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
            Continue to checkout
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            A more accessible booking page helps visitors compare plans quickly and choose a comfortable seat area without confusion.
          </p>
        </aside>
      </section>
    </main>
  );
}
