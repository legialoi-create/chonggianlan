import { SubmissionItem } from "../types";

export const SAMPLE_STUDENT_AUTHENTIC = {
  name: "Nguyen_Van_Khoa - 23020145",
  title: "Bài làm tự viết (Nhập môn - CS101)",
  code: `#include <iostream>
using namespace std;

// ham kiem tra so nguyen to
bool ktsnt(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int n;
    cout << "Nhap so luong phan tu: ";
    cin >> n;
    
    int a[1005];
    int dem = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    // in ra cac so nguyen to trong day
    cout << "Cac so nguyen to la: ";
    for (int i = 0; i < n; i++) {
        if (ktsnt(a[i])) {
            cout << a[i] << " ";
            dem++;
        }
    }
    cout << endl;
    cout << "Tong so snt: " << dem << endl;
    return 0;
}`,
};

export const SAMPLE_AI_CHATGPT = {
  name: "Le_Thanh_Tung - 23020882",
  title: "Mẫu AI ChatGPT (Doxygen & Textbook Comments)",
  code: `#include <iostream>
#include <vector>
#include <string_view>
#include <limits>

/**
 * @brief Checks if a given integer is a prime number.
 * 
 * Utilizes trial division up to sqrt(n) with 6k +/- 1 optimization.
 * 
 * @param number The integer to be verified.
 * @return true if the number is prime, false otherwise.
 */
bool isPrime(int number) {
    // Base cases
    if (number <= 1) return false;
    if (number <= 3) return true;
    if (number % 2 == 0 || number % 3 == 0) return false;

    // Optimized trial division
    for (int i = 5; i * i <= number; i += 6) {
        if (number % i == 0 || number % (i + 2) == 0) {
            return false;
        }
    }
    return true;
}

int main() {
    // Fast I/O configuration for optimal runtime performance
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int elementCount = 0;
    std::cout << "Enter number of elements: ";
    if (!(std::cin >> elementCount) || elementCount < 0) {
        std::cerr << "Invalid input format or count." << std::endl;
        return 1;
    }

    std::vector<int> numbers(elementCount);
    // Read input elements sequentially
    for (int i = 0; i < elementCount; ++i) {
        std::cin >> numbers[i];
    }

    // Filter and count prime elements
    int primeCounter = 0;
    std::cout << "Prime numbers found: ";
    for (const auto& val : numbers) {
        if (isPrime(val)) {
            std::cout << val << " ";
            ++primeCounter;
        }
    }
    std::cout << "\\nTotal prime count: " << primeCounter << "\\n";

    return 0;
}`,
};

export const SAMPLE_AI_CLAUDE_ADVANCED = {
  name: "Tran_Hoang_Nam - 23021004",
  title: "Mẫu AI Claude (C++20 Ranges, Lambda & std::optional)",
  code: `#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>
#include <optional>
#include <numeric>

[[nodiscard]] constexpr bool is_prime(int n) noexcept {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; ++i) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    if (!(std::cin >> n)) return 0;

    std::vector<int> data(n);
    for (auto& item : data) std::cin >> item;

    // Utilize C++20 views and filter pipeline with lambda
    auto prime_view = data 
        | std::views::filter([](int val) noexcept { return is_prime(val); });

    std::vector<int> primes(prime_view.begin(), prime_view.end());

    std::cout << "Primes: ";
    std::ranges::for_each(primes, [](int p) { std::cout << p << ' '; });
    std::cout << "\\nCount: " << primes.size() << '\\n';

    return 0;
}`,
};

export const SAMPLE_CLASS_BATCH: SubmissionItem[] = [
  {
    id: "sub-1",
    studentName: "Doan_Minh_Tri",
    fileName: "Doan_Minh_Tri/cau1.cpp",
    exerciseName: "cau1.cpp",
    folder: "Doan_Minh_Tri",
    code: `#include <iostream>
using namespace std;

// tim duong di ngan nhat bang bfs
int a[100][100];
int d[100];
int q[1000];
int head = 0, tail = 0;

int main() {
    int n, m;
    cin >> n >> m;
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        a[u][v] = 1;
        a[v][u] = 1;
    }
    for (int i = 1; i <= n; i++) d[i] = -1;
    
    // bfs tu dinh 1
    d[1] = 0;
    q[tail++] = 1;
    while (head < tail) {
        int u = q[head++];
        for (int v = 1; v <= n; v++) {
            if (a[u][v] == 1 && d[v] == -1) {
                d[v] = d[u] + 1;
                q[tail++] = v;
            }
        }
    }
    for (int i = 1; i <= n; i++) cout << d[i] << " ";
    return 0;
}`,
  },
  {
    id: "sub-2",
    studentName: "Bui_Quoc_Anh",
    fileName: "Bui_Quoc_Anh/cau1.cpp",
    exerciseName: "cau1.cpp",
    folder: "Bui_Quoc_Anh",
    code: `#include <iostream>
#include <vector>
#include <queue>

/**
 * @brief Computes single-source shortest path using Breadth-First Search (BFS).
 * 
 * @param startNode The starting vertex index.
 * @param adjList The unweighted graph representation.
 * @return std::vector<int> Shortest distances from startNode to all vertices.
 */
std::vector<int> computeShortestDistances(int startNode, const std::vector<std::vector<int>>& adjList) {
    int numVertices = adjList.size();
    // Initialize distances with -1 indicating unvisited state
    std::vector<int> distances(numVertices, -1);
    std::queue<int> traversalQueue;

    // Base step: mark source node
    distances[startNode] = 0;
    traversalQueue.push(startNode);

    while (!traversalQueue.empty()) {
        int currentVertex = traversalQueue.front();
        traversalQueue.pop();

        // Iterate through all adjacent neighbors
        for (int neighbor : adjList[currentVertex]) {
            if (distances[neighbor] == -1) {
                distances[neighbor] = distances[currentVertex] + 1;
                traversalQueue.push(neighbor);
            }
        }
    }
    return distances;
}

int main() {
    // Optimize standard I/O operations
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int vertices = 0, edges = 0;
    if (!(std::cin >> vertices >> edges)) return 1;

    std::vector<std::vector<int>> adjList(vertices + 1);
    for (int i = 0; i < edges; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }

    auto distances = computeShortestDistances(1, adjList);
    for (int i = 1; i <= vertices; ++i) {
        std::cout << distances[i] << (i == vertices ? "" : " ");
    }
    std::cout << "\n";
    return 0;
}`,
  },
  {
    id: "sub-3",
    studentName: "Tran_Gia_Huy",
    fileName: "Tran_Gia_Huy/cau1.cpp",
    exerciseName: "cau1.cpp",
    folder: "Tran_Gia_Huy",
    code: `#include <iostream>
#include <vector>
#include <queue>

// Function: calculateShortestPathUsingBFS
// Calculates shortest distances from a starting vertex using BFS algorithm.
std::vector<int> calculateShortestPathUsingBFS(int sourceNode, const std::vector<std::vector<int>>& graphAdj) {
    int totalNodes = graphAdj.size();
    // Initialize distances with -1 denoting unvisited nodes
    std::vector<int> distArray(totalNodes, -1);
    std::queue<int> bfsQueue;

    // Base step: mark source node
    distArray[sourceNode] = 0;
    bfsQueue.push(sourceNode);

    while (!bfsQueue.empty()) {
        int curr = bfsQueue.front();
        bfsQueue.pop();

        // Iterate through all adjacent neighbors
        for (int adj : graphAdj[curr]) {
            if (distArray[adj] == -1) {
                distArray[adj] = distArray[curr] + 1;
                bfsQueue.push(adj);
            }
        }
    }
    return distArray;
}

int main() {
    // Optimize standard I/O operations
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int nNodes = 0, nEdges = 0;
    if (!(std::cin >> nNodes >> nEdges)) return 1;

    std::vector<std::vector<int>> graphAdj(nNodes + 1);
    for (int idx = 0; idx < nEdges; ++idx) {
        int fromNode = 0, toNode = 0;
        std::cin >> fromNode >> toNode;
        graphAdj[fromNode].push_back(toNode);
        graphAdj[toNode].push_back(fromNode);
    }

    auto resultDist = calculateShortestPathUsingBFS(1, graphAdj);
    for (int i = 1; i <= nNodes; ++i) {
        std::cout << resultDist[i] << (i == nNodes ? "" : " ");
    }
    std::cout << "\n";
    return 0;
}`,
  },
  {
    id: "sub-4",
    studentName: "Vu_Phuong_Nhi",
    fileName: "Vu_Phuong_Nhi/cau1.cpp",
    exerciseName: "cau1.cpp",
    folder: "Vu_Phuong_Nhi",
    code: `#include <iostream>
using namespace std;

int n, m;
int canh[100][2];
int d[100];

int main() {
    cin >> n >> m;
    for(int i=0; i<m; i++){
        cin >> canh[i][0] >> canh[i][1];
    }
    // chua lam kip bfs em lam tam for tra ve -1
    for(int i=1; i<=n; i++) cout << (i == 1 ? 0 : -1) << " ";
    return 0;
}`,
  },
  {
    id: "sub-5",
    studentName: "Bui_Quoc_Anh",
    fileName: "Bui_Quoc_Anh/cau2.cpp",
    exerciseName: "cau2.cpp",
    folder: "Bui_Quoc_Anh",
    code: `#include <iostream>
#include <vector>
#include <algorithm>

/**
 * @brief Solves 0/1 Knapsack problem using dynamic programming table.
 */
int knapsack(int capacity, const std::vector<int>& weights, const std::vector<int>& values, int n) {
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int w = 0; w <= capacity; ++w) {
            if (weights[i - 1] <= w) {
                dp[i][w] = std::max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][capacity];
}

int main() {
    int n = 0, capacity = 0;
    if (std::cin >> n >> capacity) {
        std::vector<int> w(n), v(n);
        for (int i = 0; i < n; i++) std::cin >> w[i] >> v[i];
        std::cout << knapsack(capacity, w, v, n) << "\\n";
    }
    return 0;
}`,
  },
  {
    id: "sub-6",
    studentName: "Tran_Gia_Huy",
    fileName: "Tran_Gia_Huy/cau2.cpp",
    exerciseName: "cau2.cpp",
    folder: "Tran_Gia_Huy",
    code: `#include <iostream>
#include <vector>
#include <algorithm>

// Solve 0/1 Knapsack problem with dynamic programming matrix
int computeKnapsack(int maxCapacity, const std::vector<int>& itemWeights, const std::vector<int>& itemValues, int itemCount) {
    std::vector<std::vector<int>> memo(itemCount + 1, std::vector<int>(maxCapacity + 1, 0));
    for (int idx = 1; idx <= itemCount; ++idx) {
        for (int curWeight = 0; curWeight <= maxCapacity; ++curWeight) {
            if (itemWeights[idx - 1] <= curWeight) {
                memo[idx][curWeight] = std::max(memo[idx - 1][curWeight], memo[idx - 1][curWeight - itemWeights[idx - 1]] + itemValues[idx - 1]);
            } else {
                memo[idx][curWeight] = memo[idx - 1][curWeight];
            }
        }
    }
    return memo[itemCount][maxCapacity];
}

int main() {
    int count = 0, bagCap = 0;
    if (std::cin >> count >> bagCap) {
        std::vector<int> weights(count), values(count);
        for (int i = 0; i < count; i++) std::cin >> weights[i] >> values[i];
        std::cout << computeKnapsack(bagCap, weights, values, count) << "\\n";
    }
    return 0;
}`,
  },
];
