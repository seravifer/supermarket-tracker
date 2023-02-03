let observer = null;
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (observer != null) {
      observer.disconnect();
      observer = null;
    }
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
        observer = null;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

let previousUrl = "";
function onURLChange(callback) {
  let observerUrl = new MutationObserver(() => {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      callback();
    }
  });
  observerUrl.observe(document, { subtree: true, childList: true });
}

onURLChange(() => {
  checkPrice();
});

function checkPrice() {
  waitForElm("[data-test='private-product-detail-info']").then(async (elm) => {
    const productId = location.href.split("/")[4];
    const response = await fetch(
      `https://us-central1-markettracker-85aa0.cloudfunctions.net/article?id=${productId}&company=mercadona`,
      {
        method: "GET",
        mode: "cors",
      }
    );
    const product = await response.json();
    const today = product.histories.at(-1);
    product.histories.push({
      ...today,
      timestamp: new Date().toISOString(),
    });
    const chart = document.createElement("canvas");
    chart.id = "chart";
    chart.style = "margin-top: 20px;";
    elm.appendChild(chart);

    new Chart(chart, {
      type: "line",
      data: {
        labels: product.histories.map((row) => new Intl.DateTimeFormat("es-ES").format(new Date(row.timestamp))),
        datasets: [
          {
            label: "Precio",
            data: product.histories.map((row) => row.price),
            borderColor: "#fcb831",
          },
          {
            label: "Precio por unidad",
            data: product.histories.map((row) => row.bulkPrice),
            borderColor: "#229e6b",
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              callback: (value) => {
                return new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                    context.parsed.y
                  );
                }
                return label;
              },
            },
          },
        },
      },
    });
  });
}
