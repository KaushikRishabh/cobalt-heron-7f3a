# Methodology and decision limits

## 1. Scope and dates

The assignment refers to **purchase decisions in January**, so decision D in January maps to calendar delivery day D+1: 2 January–1 February2026. This is a decision-support calendar abstraction, not full exchange contract/order modeling. All relevant dates are GMT; implementation nevertheless uses timezone-aware Europe/London conversion.

The brief does not prescribe a gate. The default 09:45 cutoff is a clearly labeled working assumption, five minutes before the [documented N2EX 09:50 GMT gate](https://support.nordpoolgroup.com/support/solutions/folders/8000087216). Other GB auctions and team processes differ. The user can change the time; later times are sensitivity analysis, not automatically a valid pre-auction decision.

## 2. Point-in-time selection

For each target hour t, select the forecast record with greatest publication time p satisfying p <= cutoff(D). Never use the latest historical forecast endpoint, which would introduce revisions unavailable when purchasing. Retain all retrieved vintages. Records sharing target and publication with conflicting values are errors, not silently order-dependent choices.

Publication is the brief's available-time proxy. It does not prove an individual desk received the information immediately; network/operational delays are not modeled. No later actual is used to choose the forecast.

## 3. Resolution and coverage

Elexon's [wind page](https://bmrs.elexon.co.uk/wind-generation) describes hourly forecasts for operationally metered wind visible to the system operator. The actual archive contains half-hourly FUELHH WIND records. The pilot compares F(t) to A(t) = [A_HH(t) + A_HH(t+30min)] / 2. Both actual half-hours are required. Forecasts are not falsely presented as native half-hourly values.

**Caveat:** available documentation does not establish that the forecast value is exactly the hourly mean of the same metered population as FUELHH. This is a disclosed comparison convention. Differences can reflect scope, curtailment, revisions and timing as well as meteorological prediction error. “National” here means the specified Elexon datasets, not a claim to represent all embedded UK wind. Do not infer a causal source of bias from these two datasets alone.

Actuals are the latest available records in the retrieved archive, used for retrospective evaluation. The archive is not a settlement-finality guarantee.

## 4. Metrics

For n complete matched hours, error e = forecast − actual, in MW:

- MAE = sum(abs(e))/n: typical absolute miss, in the same power units.
- RMSE = sqrt(sum(e²)/n): emphasizes larger misses.
- Bias = sum(e)/n: positive means systematic overforecast in this evaluation window.
- WAPE = 100 × sum(abs(e))/sum(actual); undefined for zero total actual, returned null rather than infinity.
- Energy difference = sum(e × 1hour), MWh, over matched hours only.
- Coverage = matched hours / expected hours. Full window has31 ×24 =744 hours.

Energy totals are not comparable across selections with different coverage without considering coverage. A daily forecast total may be partial if forecast coverage is incomplete. Zero generation is a valid observation; missing values are not zero.

## 5. What not to conclude

Full-month scores are **descriptive hindsight**, not a confidence interval, procurement reserve or prospective trading rule. No optimized safety margin, bias correction or savings claim is fitted and then evaluated on the same month. A production risk allowance would require a pre-decision training window, availability-aware outturn vintages, walk-forward validation and business-specific cost asymmetry. Those inputs are not invented here.

National wind cannot tell us the client's residual purchase requirement without its demand, contracted wind share and other generation. The app informs wind uncertainty; it does not place orders.
