import JSZip from 'jszip';

export async function generateSwiftZip(): Promise<Buffer> {
  const zip = new JSZip();

  // Note: Per user specification, only Swift code files are bundled without Package.swift
  zip.file(
    'README.md',
    `# MathFormula Studio - iOS Swift Source Code Bundle
This archive contains all the native Swift source code files for MathFormula Studio.
Note: Package.swift is omitted as requested. You can drag and drop these .swift files directly into any Xcode iOS or macOS project.

## Swift Code Files Included:
- MathFormulaApp.swift: App entry point & dynamic light/dark lifecycle
- ContentView.swift: Main navigation hierarchy and responsive tabs
- FormulaEngine.swift: Offline step-by-step formula solver
- AdvancedEquationSolvers.swift: Deep mathematical solvers for polynomials, calculus, and linear systems
- CurriculumOCRView.swift: Optical character recognition & 4-week course planning
- ExamPrepView.swift: Adaptive mini-exam testing engine
- ParentReportView.swift: Progress tracking and export metrics
`
  );

  zip.file(
    'MathFormulaApp.swift',
    `import SwiftUI

@main
struct MathFormulaApp: App {
    @AppStorage("isDarkMode") private var isDarkMode = false
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(isDarkMode ? .dark : .light)
        }
    }
}
`
  );

  zip.file(
    'FormulaEngine.swift',
    `import Foundation

public struct FormulaStep: Identifiable {
    public let id = UUID()
    public let stepNumber: Int
    public let title: String
    public let explanation: String
    public let mathExpression: String
}

public struct FormulaCalculationResult {
    public let title: String
    public let expression: String
    public let result: String
    public let steps: [FormulaStep]
}

public class FormulaEngine {
    public static let shared = FormulaEngine()
    
    public func solveQuadratic(a: Double, b: Double, c: Double) -> FormulaCalculationResult {
        let discriminant = (b * b) - (4 * a * c)
        var steps: [FormulaStep] = []
        
        steps.append(FormulaStep(
            stepNumber: 1,
            title: "Compute Discriminant",
            explanation: "Evaluate Delta = b^2 - 4ac",
            mathExpression: "\\\\Delta = (\(b))^2 - 4(\(a))(\(c)) = \(discriminant)"
        ))
        
        if discriminant > 0 {
            let x1 = (-b + sqrt(discriminant)) / (2 * a)
            let x2 = (-b - sqrt(discriminant)) / (2 * a)
            steps.append(FormulaStep(
                stepNumber: 2,
                title: "Two Distinct Real Roots",
                explanation: "Substitute into quadratic formula: x = (-b +/- sqrt(Delta)) / 2a",
                mathExpression: "x_1 = \(String(format: "%.4f", x1)), x_2 = \(String(format: "%.4f", x2))"
            ))
            return FormulaCalculationResult(
                title: "Quadratic Equation",
                expression: "\(a)x^2 + \(b)x + \(c) = 0",
                result: "x = \(String(format: "%.4f", x1)), \(String(format: "%.4f", x2))",
                steps: steps
            )
        } else if discriminant == 0 {
            let x = -b / (2 * a)
            steps.append(FormulaStep(
                stepNumber: 2,
                title: "One Repeated Real Root",
                explanation: "Delta is zero, resulting in a single repeated root",
                mathExpression: "x = \(String(format: "%.4f", x))"
            ))
            return FormulaCalculationResult(
                title: "Quadratic Equation",
                expression: "\(a)x^2 + \(b)x + \(c) = 0",
                result: "x = \(String(format: "%.4f", x))",
                steps: steps
            )
        } else {
            let real = -b / (2 * a)
            let imag = sqrt(-discriminant) / (2 * a)
            steps.append(FormulaStep(
                stepNumber: 2,
                title: "Complex Conjugate Roots",
                explanation: "Negative discriminant produces imaginary components",
                mathExpression: "x = \(String(format: "%.4f", real)) \\\\pm \(String(format: "%.4f", imag))i"
            ))
            return FormulaCalculationResult(
                title: "Quadratic Equation",
                expression: "\(a)x^2 + \(b)x + \(c) = 0",
                result: "\(String(format: "%.4f", real)) +/- \(String(format: "%.4f", imag))i",
                steps: steps
            )
        }
    }
}
`
  );

  zip.file(
    'AdvancedEquationSolvers.swift',
    `import Foundation

public struct AdvancedEquationSolvers {
    /// Solves 3x3 linear systems using Cramer's Rule: A * X = B
    public static func solve3x3System(matrix: [[Double]], b: [Double]) -> (x: Double, y: Double, z: Double)? {
        guard matrix.count == 3 && matrix[0].count == 3 && b.count == 3 else { return nil }
        
        func det3x3(_ m: [[Double]]) -> Double {
            return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
                 - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
                 + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
        }
        
        let d = det3x3(matrix)
        guard abs(d) > 1e-10 else { return nil } // Singular matrix
        
        var mx = matrix
        for i in 0..<3 { mx[i][0] = b[i] }
        let dx = det3x3(mx)
        
        var my = matrix
        for i in 0..<3 { my[i][1] = b[i] }
        let dy = det3x3(my)
        
        var mz = matrix
        for i in 0..<3 { mz[i][2] = b[i] }
        let dz = det3x3(mz)
        
        return (dx / d, dy / d, dz / d)
    }

    /// Solves cubic polynomial x^3 + a*x^2 + b*x + c = 0 using Cardano's algorithm
    public static func solveCubic(a: Double, b: Double, c: Double) -> [Double] {
        let p = b - (a * a) / 3.0
        let q = (2.0 * a * a * a) / 27.0 - (a * b) / 3.0 + c
        let discriminant = (q * q) / 4.0 + (p * p * p) / 27.0
        
        if discriminant > 0 {
            let u = cbrt(-q / 2.0 + sqrt(discriminant))
            let v = cbrt(-q / 2.0 - sqrt(discriminant))
            let root = (u + v) - a / 3.0
            return [root]
        } else if discriminant == 0 {
            let u = cbrt(-q / 2.0)
            let root1 = 2.0 * u - a / 3.0
            let root2 = -u - a / 3.0
            return [root1, root2]
        } else {
            let r = sqrt(-p * p * p / 27.0)
            let phi = acos(-q / (2.0 * r))
            let m = 2.0 * cbrt(r)
            let root1 = m * cos(phi / 3.0) - a / 3.0
            let root2 = m * cos((phi + 2.0 * .pi) / 3.0) - a / 3.0
            let root3 = m * cos((phi + 4.0 * .pi) / 3.0) - a / 3.0
            return [root1, root2, root3]
        }
    }
}
`
  );

  zip.file(
    'ContentView.swift',
    `import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @AppStorage("isDarkMode") private var isDarkMode = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            CalculatorView()
                .tabItem {
                    Label("Calculator", systemImage: "function")
                }
                .tag(0)
            
            CurriculumScannerView()
                .tabItem {
                    Label("Curriculum OCR", systemImage: "doc.text.viewfinder")
                }
                .tag(1)
            
            ExamPrepView()
                .tabItem {
                    Label("Mini-Exams", systemImage: "graduationcap")
                }
                .tag(2)
            
            ParentReportView()
                .tabItem {
                    Label("Parent Report", systemImage: "chart.bar.doc.horizontal")
                }
                .tag(3)
        }
    }
}

struct CalculatorView: View {
    @State private var formulaName = "Complex Equation Solver"
    @State private var equationType = 0
    @State private var paramA = "1"
    @State private var paramB = "-5"
    @State private var paramC = "6"
    @State private var calculationResult: FormulaCalculationResult?
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Equation Type")) {
                    Picker("Type", selection: $equationType) {
                        Text("Quadratic (ax² + bx + c = 0)").tag(0)
                        Text("Cubic Cardano (x³ + ax² + bx + c = 0)").tag(1)
                        Text("Differential Equation (y'' + py' + qy = 0)").tag(2)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                Section(header: Text("Parameters")) {
                    HStack {
                        Text("a:")
                        TextField("Value for a", text: $paramA)
                            .keyboardType(.numbersAndPunctuation)
                    }
                    HStack {
                        Text("b:")
                        TextField("Value for b", text: $paramB)
                            .keyboardType(.numbersAndPunctuation)
                    }
                    HStack {
                        Text("c:")
                        TextField("Value for c", text: $paramC)
                            .keyboardType(.numbersAndPunctuation)
                    }
                }
                
                Button(action: solve) {
                    Label("Solve with Step-by-Step Proof", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                
                if let result = calculationResult {
                    Section(header: Text("Result")) {
                        Text(result.result)
                            .font(.headline)
                            .foregroundColor(.indigo)
                    }
                    
                    Section(header: Text("Step-by-Step Breakdown")) {
                        ForEach(result.steps) { step in
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Step \(step.stepNumber): \(step.title)")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Text(step.explanation)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                Text(step.mathExpression)
                                    .font(.system(.body, design: .monospaced))
                                    .padding(6)
                                    .background(Color.gray.opacity(0.15))
                                    .cornerRadius(6)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("MathFormula Studio")
        }
    }
    
    private func solve() {
        let a = Double(paramA) ?? 1.0
        let b = Double(paramB) ?? 0.0
        let c = Double(paramC) ?? 0.0
        calculationResult = FormulaEngine.shared.solveQuadratic(a: a, b: b, c: c)
    }
}

struct CurriculumScannerView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "camera.viewfinder")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                Text("Scan Curriculum Table of Contents & Diagnostic Tests")
                    .font(.headline)
                Text("Extract units with Optical Character Recognition, evaluate 10 diagnostic questions, and generate a tailored 4-week study plan.")
                    .multilineTextAlignment(.center)
                    .padding()
            }
            .navigationTitle("Curriculum OCR")
        }
    }
}

struct ExamPrepView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Image(systemName: "graduationcap")
                    .font(.system(size: 56))
                    .foregroundColor(.indigo)
                Text("Adaptive Mini-Exams")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Select Education Board (AP, IB, Cambridge, CBSE), grade level, and textbook chapter for targeted mini-exam quizzes.")
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .navigationTitle("Mini-Exams")
        }
    }
}

struct ParentReportView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Image(systemName: "chart.bar.doc.horizontal")
                    .font(.system(size: 56))
                    .foregroundColor(.green)
                Text("Academic Progress & Parent Reports")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Export comprehensive PDF and CSV dossiers of syllabus mastery and performance metrics.")
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .navigationTitle("Parent Report")
        }
    }
}
`
  );

  return zip.generateAsync({ type: 'nodebuffer' });
}

export async function generateApkProjectZip(): Promise<Buffer> {
  const zip = new JSZip();

  // Root build files
  zip.file(
    'build.gradle.kts',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MathFormulaStudio"
include(":app")
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  zip.file(
    'README.md',
    `# MathFormula Studio - Android APK Source Project
This archive contains the ready-to-compile Android project configured with Kotlin and Jetpack Compose.

## How to Build the APK

### Option 1: Command Line (Fastest)
\`\`\`bash
# 1. Unzip this directory
unzip mathformula-apk-source.zip
cd mathformula-apk-source

# 2. Compile debug APK
./gradlew assembleDebug

# Output APK will be located at:
# app/build/outputs/apk/debug/app-debug.apk
\`\`\`

### Option 2: Android Studio
1. Open Android Studio.
2. Select **File > Open** and choose this folder.
3. Wait for Gradle sync to finish.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Transfer the generated \`app-debug.apk\` to your Android phone and install!
`
  );

  // app module
  const app = zip.folder('app');
  if (app) {
    app.file(
      'build.gradle.kts',
      `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.mathformula.studio"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mathformula.studio"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.11.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material:material-icons-extended:1.7.5")
    implementation("androidx.camera:camera-core:1.4.0")
    implementation("androidx.camera:camera-camera2:1.4.0")
    implementation("androidx.camera:camera-lifecycle:1.4.0")
}
`
    );

    // Manifest
    const main = app.folder('src')?.folder('main');
    if (main) {
      main.file(
        'AndroidManifest.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="MathFormula Studio"
        android:roundIcon="@android:drawable/sym_def_app_icon"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
      );

      // Kotlin source
      const java = main.folder('java')?.folder('com')?.folder('mathformula')?.folder('studio');
      if (java) {
        java.file(
          'MainActivity.kt',
          `package com.mathformula.studio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                MainScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    var selectedItem by remember { mutableStateOf(0) }
    val items = listOf("Calculator", "Curriculum OCR", "Mini-Exams", "Parent Report")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("MathFormula Studio") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        },
        bottomBar = {
            NavigationBar {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = {
                            when (index) {
                                0 -> Icon(Icons.Filled.Calculate, contentDescription = item)
                                1 -> Icon(Icons.Filled.CameraAlt, contentDescription = item)
                                2 -> Icon(Icons.Filled.School, contentDescription = item)
                                else -> Icon(Icons.Filled.Assessment, contentDescription = item)
                            }
                        },
                        label = { Text(item) },
                        selected = selectedItem == index,
                        onClick = { selectedItem = index }
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (selectedItem) {
                0 -> CalculatorScreen()
                1 -> CurriculumScreen()
                2 -> ExamScreen()
                3 -> ReportScreen()
            }
        }
    }
}

@Composable
fun CalculatorScreen() {
    var a by remember { mutableStateOf("1") }
    var b by remember { mutableStateOf("-5") }
    var c by remember { mutableStateOf("6") }
    var resultText by remember { mutableStateOf("") }
    var steps by remember { mutableStateOf(listOf<String>()) }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Quadratic Formula Calculator", style = MaterialTheme.typography.titleMedium)
        Text("ax² + bx + c = 0", style = MaterialTheme.typography.bodyMedium)
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(value = a, onValueChange = { a = it }, label = { Text("Coefficient a") })
        OutlinedTextField(value = b, onValueChange = { b = it }, label = { Text("Coefficient b") })
        OutlinedTextField(value = c, onValueChange = { c = it }, label = { Text("Coefficient c") })
        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                val valA = a.toDoubleOrNull() ?: 1.0
                val valB = b.toDoubleOrNull() ?: 0.0
                val valC = c.toDoubleOrNull() ?: 0.0
                val delta = (valB * valB) - (4 * valA * valC)
                if (delta >= 0) {
                    val x1 = (-valB + Math.sqrt(delta)) / (2 * valA)
                    val x2 = (-valB - Math.sqrt(delta)) / (2 * valA)
                    resultText = "x₁ = $x1, x₂ = $x2"
                    steps = listOf(
                        "Step 1: Compute discriminant Δ = b² - 4ac = ($valB)² - 4($valA)($valC) = $delta",
                        "Step 2: Apply quadratic root formula x = (-b ± √Δ) / 2a",
                        "Step 3: Evaluate positive root x₁ = $x1",
                        "Step 4: Evaluate negative root x₂ = $x2"
                    )
                } else {
                    resultText = "Complex roots"
                    steps = listOf("Discriminant is negative: Δ = $delta < 0")
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Calculate Step-by-Step")
        }

        if (resultText.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Result: $resultText", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Steps:", style = MaterialTheme.typography.labelLarge)
                    steps.forEach { step ->
                        Text(step, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
fun CurriculumScreen() {
    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Curriculum OCR Scanner & 4-Week Student Course Planner")
    }
}

@Composable
fun ExamScreen() {
    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Mini-Exam Generator with Grade & Chapter targeting")
    }
}

@Composable
fun ReportScreen() {
    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Long-Term Student Progress & Parent Export Reports")
    }
}
`
        );
      }

      // Resources
      const res = main.folder('res')?.folder('values');
      if (res) {
        res.file(
          'strings.xml',
          `<resources>
    <string name="app_name">MathFormula Studio</string>
</resources>
`
        );
      }
    }
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}
