import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { getApiUrl } from "@/lib/apiUrl";

//chart js being registered
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function OutcomeGraph({ eventId }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchTransactionData();
    }
  }, [eventId]);

  const fetchTransactionData = async () => {
    try {
      const response = await axios.get(
        `${getApiUrl()}/graph/event-transactions/${eventId}`
      );
      const transactions = response.data.transactions;

      if (transactions.length === 0) {
        setLoading(false);
        return;
      }

      //group all transactions by outcomes
      const outcomeMap = {};
      transactions.forEach((transaction) => {
        if (!outcomeMap[transaction.outcome_id]) {
          outcomeMap[transaction.outcome_id] = {
            name: transaction.outcome_name,
            yesShares: [],
            noShares: [],
          };
        }
      });

      const formatLabel = (ts) =>
        new Date(ts).toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

      //builds the cumulative share outcomes starting at 100 since all outcomes start with 100 shares
      const cumulativeShares = {};
      const allYesData = {};
      const allNoData = {};
      Object.keys(outcomeMap).forEach((outcomeId) => {
        cumulativeShares[outcomeId] = { YES: 100, NO: 100 };
        allYesData[outcomeId] = [100];
        allNoData[outcomeId] = [100];
      });

      const datasets = [];
      const labels = [formatLabel(transactions[0].created_at)]; // initial point for starting shares

      transactions.forEach((transaction) => {
        const outcomeId = transaction.outcome_id;
        const type = (transaction.type || "").toUpperCase();
        const position = (transaction.position || "").toUpperCase();
        const qty = Number(transaction.share_count) || 0;

        //update the shares
        if (type === "BUY") {
          cumulativeShares[outcomeId][position] += qty;
        } else if (type === "SELL") {
          cumulativeShares[outcomeId][position] -= qty;
        }

        //add new data points to the graph
        labels.push(formatLabel(transaction.created_at));

        // push data points: update traded outcome; carry forward others
        Object.keys(outcomeMap).forEach((id) => {
          const lastYes = allYesData[id][allYesData[id].length - 1];
          const lastNo = allNoData[id][allNoData[id].length - 1];

          if (id === String(outcomeId)) {
            allYesData[id].push(cumulativeShares[id].YES);
            allNoData[id].push(cumulativeShares[id].NO);
          } else {
            allYesData[id].push(lastYes);
            allNoData[id].push(lastNo);
          }
        });
      });

      // make the colours for the lines 
      const colors = [
        { yes: "rgb(34, 197, 94)", no: "rgb(239, 68, 68)" }, // green/red
        { yes: "rgb(59, 130, 246)", no: "rgb(249, 115, 22)" }, // blue/orange
        { yes: "rgb(168, 85, 247)", no: "rgb(236, 72, 153)" }, // purple/pink
        { yes: "rgb(20, 184, 166)", no: "rgb(251, 146, 60)" }, // teal/amber
      ];

      Object.keys(outcomeMap).forEach((outcomeId, index) => {
        const outcome = outcomeMap[outcomeId];
        const colorSet = colors[index % colors.length];

        //yes lines
        datasets.push({
          label: `${outcome.name} - YES`,
          data: allYesData[outcomeId],
          borderColor: colorSet.yes,
          backgroundColor: colorSet.yes,
          tension: 0,
        });

        //no line
        datasets.push({
          label: `${outcome.name} - NO`,
          data: allNoData[outcomeId],
          borderColor: colorSet.no,
          backgroundColor: colorSet.no,
          tension: 0,
        });
      });

      setChartData({
        labels,
        datasets,
      });
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  if (!chartData || chartData.datasets.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">No transactions yet. Start trading!</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Share Ownership Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Shares Owned",
        },
      },
      x: {
        display: false, //hide the x axis lables
      },
    },
  };

  return (
    <div className="w-full h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
}