# Security hardening

This version is the strongest package so far for cost protection and abuse reduction.

## Added protection
- Signed reward token for reward-claim flow
- Reward claim cooldown and hourly throttling
- Security event logging in `security_events`
- AI usage logging in `ai_usage_logs`
- File count, file size, total upload size, text length, and image count limits
- Estimated input token and estimated cost guardrail before OpenAI call
- Per-user short-window analysis throttling
- Per-user daily analysis cap
- Monthly analysis limit enforced inside SQL RPC function
- Margin protection guardrail before running analysis

## What it protects against
- API abuse and burst requests
- Very large expensive prompts
- Repeat reward-claim spam
- Unprofitable low-margin analysis requests
- Weak visibility into AI cost

## Important honesty note
No internet SaaS can be made literally 100 percent risk-free.
This version is much harder to abuse and much safer financially, but you still need:
- real production monitoring
- marketplace credentials configured correctly
- ad network callbacks for true rewarded-ad verification
- standard DevOps hygiene
