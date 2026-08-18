**Banrox — Squad Card Landing Page**

**Revision Notes — Round 2 Corrections**

**Reference site:** https://banrox-landing.vercel.app/

**Prepared by:** Grant Nicart

**Prepared for:** Nihal (development)

**Date:** August 16, 2026

**Status:** Open — awaiting implementation

# **Summary**

The previous revision addressed the wrong issue and introduced a new one. The original request was about how long individual elements took to become visible within a section, and how they popped into view — not about adding any kind of animated transition between sections. As implemented, moving between sections now feels like switching from one page to another, rather than scrolling. There should be no distinct transition effect between sections at all — movement from one numbered section to the next should read as plain, continuous scrolling. This document consolidates the original per-element animation-timing feedback and this navigation-flow correction into one corrected brief, referencing the actual site sections as they exist today.

# **1\. Core Misunderstanding to Correct**

The section-to-section movement (moving from one numbered section to the next — e.g. from "01 Squad Card" into "02 Alone Vs Together") should never read as a distinct transition, switch, or cut. There is no separate "transition animation" to add between sections — it should simply be a continuous scroll, exactly like scrolling down any normal page. The previous revision introduced a page-swap feel here; that is the regression to undo, not a missing animation to add back.

Separately, and correctly flagged in the original feedback: the visibility and pop-in timing of individual elements inside a section — specifically in Section 01 (Squad Card / hero) — needs attention, where assets were appearing too abruptly or taking too long to resolve into view. That per-element timing issue is real and still needs fixing (see Section 4 below). It is a distinct issue from the section-to-section movement covered in this section.

# **2\. Current Regression: Page-to-Page Feel Instead of Scroll**

As currently built, moving between sections feels like navigating from one page to another — a hard switch/cut — rather than a continuous scroll down a single page. This breaks the intended experience of the site as one connected flow (Squad Card → Alone Vs Together → Squad Approves → How Squad Works → Intelligence Layer → Invite Your Squad → Early Access → Contacts).

* The section-by-section scroll mechanism itself (one section occupying the viewport at a time, snapping cleanly between them) is correct and should be kept as-is.

* Correction: do NOT add any kind of transition/switch animation between sections. The fix is to make the movement between sections feel like plain scrolling — no fade, no slide, no distinct "transition" effect layered on top of the scroll-snap. It should feel exactly like scrolling, never like switching.

# **3\. Per-Asset Scroll-Triggered Animations: Remove**

Individual assets/elements inside a section should not each require their own scroll-triggered entrance animation. Once a user is on a given section, all of that section's elements should load and be visible automatically — without needing to keep scrolling within the section to trigger each card, icon, or stat to appear one at a time.

* This applies across all sections, not just Section 01\.

* The distinction to build to: section-to-section transitions \= keep animated. Element-by-element scroll-triggered reveals within a section \= remove; elements should simply be present/loaded when the section is in view.

# **4\. Section 01 (Squad Card / Hero) — Specific Requests**

This is the section called out most specifically in feedback and in the reference video. Three additions requested for this section only, unless later specified otherwise:

* Live/looping animation on the four Financial Passport cards (Aram, Mika, Lilit, David) — e.g. a continuous subtle loop rather than a static state, so the cards feel alive even without user interaction.

* A subtle background animation — gentle ambient movement (e.g. slow drift on the glow/bloom elements already present behind the hero) rather than a fully static background.

* Reinstate the original entrance animation style shown in the first reference video for this section specifically.

# **5\. Reference Materials**

Grant supplied two references in the original correction thread that should be used directly during implementation:

* A video showing the desired animation behavior — the animation style, pacing, and section-transition feel to restore. (Referenced in chat as "the first video I sent" — please confirm you have this file; re-share if it needs to be reattached here.)

* A screenshot illustrating the current page-to-page navigation problem as it looks live on the site. (Same note — confirm file access or request re-share.)

*Note: both files were shared as direct chat attachments and are not embedded in this document. Recommend Nihal confirm receipt of both before starting, since the video in particular is the primary visual reference for the corrected timing and feel.*

# **6\. Corrected Requirements Checklist**

* ☐ Remove any section-to-section transition/switch effect — movement between sections should feel like plain continuous scrolling, not a distinct animated transition or page swap

* ☐ Keep the existing per-section scroll-snap mechanism (one section per viewport) — this part is already correct

* ☐ Remove per-asset scroll-triggered entrance animations within each section — elements should auto-load once the section is in view

* ☐ Section 01 (Squad Card): add a continuous loop animation to the four Financial Passport cards

* ☐ Section 01 (Squad Card): add a subtle ambient background animation

* ☐ Section 01 (Squad Card): match entrance animation timing/style to the first reference video

# **7\. Open Items / To Confirm With Nihal**

* Confirm receipt of the reference video and screenshot from the original chat thread, or re-supply them attached to this brief.

* Confirm whether the auto-load-on-section-view behavior in Section 4 above should also apply retroactively to Sections 02–07, or only to sections not yet built out.

* Confirm expected turnaround for this round of corrections.

Reference site for all section numbering and current live behavior in this document:   
[https://banrox-landing.vercel.app/](https://banrox-landing.vercel.app/)