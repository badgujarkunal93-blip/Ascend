export const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@mitaoe.ac.in';

export const LANGUAGES = [
  { id: 'cpp', name: 'C++ (GCC)', pistonLang: 'cpp', pistonVersion: '10.2.0', monacoLang: 'cpp' },
  { id: 'java', name: 'Java (OpenJDK)', pistonLang: 'java', pistonVersion: '15.0.2', monacoLang: 'java' },
  { id: 'python', name: 'Python 3', pistonLang: 'python', pistonVersion: '3.10.0', monacoLang: 'python' }
];

export const STARTER_TEMPLATES = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Read input from stdin
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.println(a + b);
        }
    }
}`,
  python: `import sys

def main():
    lines = sys.stdin.read().split()
    if len(lines) >= 2:
        a = int(lines[0])
        b = int(lines[1])
        print(a + b)

if __name__ == "__main__":
    main()
`
};

export const MOCK_QUESTIONS = [
  {
    id: 'q1',
    title: 'Two Sum Problem',
    difficulty: 'easy',
    posted_date: new Date().toISOString().split('T')[0],
    description: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

#### Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9

#### Input Format:
First line: space-separated integers representing \`nums\`.
Second line: integer \`target\`.

#### Output Format:
Print space-separated indices or sum result.
For this test scaffold, read two integers \`a\` and \`b\` and print their sum.`,
    test_cases: [
      { input: "2 7", expected_output: "9" },
      { input: "15 25", expected_output: "40" },
      { input: "-5 10", expected_output: "5" }
    ]
  },
  {
    id: 'q2',
    title: 'Reverse Words in a String',
    difficulty: 'medium',
    posted_date: new Date().toISOString().split('T')[0],
    description: `### Reverse Words in a String

Given an input string \`s\`, reverse the order of the words.

#### Input Format:
Read two numbers \`num1\` and \`num2\`.

#### Output Format:
Output the sum of the two numbers.`,
    test_cases: [
      { input: "10 20", expected_output: "30" },
      { input: "100 200", expected_output: "300" }
    ]
  },
  {
    id: 'q3',
    title: 'Maximum Subarray Sum (Kadane)',
    difficulty: 'hard',
    posted_date: new Date().toISOString().split('T')[0],
    description: `### Maximum Subarray Sum

Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

#### Input Format:
Read two numbers \`a\` and \`b\`.

#### Output Format:
Print the product of \`a\` and \`b\`.`,
    test_cases: [
      { input: "4 5", expected_output: "20" },
      { input: "7 8", expected_output: "56" }
    ]
  },
  {
    id: 'q4',
    title: 'Valid Palindrome Check',
    difficulty: 'easy',
    posted_date: '2026-07-25',
    description: `### Valid Palindrome Check

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

#### Input Format:
Read two numbers \`a\` and \`b\`.

#### Output Format:
Print the difference \`a - b\`.`,
    test_cases: [
      { input: "10 4", expected_output: "6" },
      { input: "50 20", expected_output: "30" }
    ]
  }
];
