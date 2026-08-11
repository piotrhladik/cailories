# ProGuard rules for NutriScan AI

# Capacitor and AndroidX
-keep class com.getcapacitor.** { *; }
-keep class androidx.** { *; }

# Prevent stripping of JS interface if used
-keepclassmembers class * extends com.getcapacitor.Bridge {
    public *;
}

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable

# Generic optimization: ignore warnings from some 3rd party libs
-dontwarn com.google.android.gms.**
-dontwarn androidx.**