# San Francisco Municipal Railway (SF Muni) Live Map
By Varuni Saxena

### Live URL: 
* http://varunis.com/projects/SFMuni/

### Run on dev:
* Download, run `http-server`, and browse to `localhost:port`.

```
git clone https://varunis.github.io/projects/SFMuni/ .
cd SFMuni
# required for local assets.
http-server
# browse to localhost:port displayed.
```

* `http-server` is required because map assets are local. Install using `npm install http-server`.

### Features:
* Zoomable map with neighborhoods and streets view.
* Live refresh every 15 seconds.
* Multi selectable dropdown with search option.
* Selected dropdown options can display 1 to n route options at a time.
* Diffrent colored route and vehicles.
* Matching route and vehicle colors.
* Tooltip on mouseover for each vehicle displaying the route tag, speed, and last update.

### Notes:
* Tested on latest version of chrome v58.0.3029.110.
* I was able to inject d3js into AngularJS. However, I had started the current project with standard jQuery and d3js. Moving this project purely in AngularJS would require a bit more time (I only had the weekend to work on this).

### Future Work:
#### Usability:
* Make the application more responsive.
* Better icons for trains and buses.
* Provide functionality to see a vehicle history.
* Display route stops (information is already parsed) and next stop for a particular vehicle.
* Map recentering on zoom-out.

#### Technical:
* Supoort HTTPS. Use proxy to re-direct data from http://webservices.nextbus.com.
* Convert to AngularJS project with npm dependencies and webpack module bundler.
* Unit tests and end-to-end test using Karma, Jasmine, and Protractor.
* Use of CSS pre-processor such as sass.
* Optimization (e.g., maps are heavy right now).

### References:
* Besides the scripts and resources already mentioned in the code, blogs by d3's Mike Bostocks and his code examples like https://bl.ocks.org/mbostock/5593150 were very helpful.
