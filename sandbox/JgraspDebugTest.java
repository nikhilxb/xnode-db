import java.util.ArrayList;

class JgraspDebugTest {

   private static class InnerClass {
      private double myI;
      public InnerClass(double i) {
         myI = i;
      }
   }
   public static void main(String[] args) {
      System.out.println("HERRO");
      int x = 5;
      double y = 4.0;
      ArrayList<Object> z = new ArrayList<Object>();
      z.add(x);
      InnerClass asdf = new InnerClass(y);
      z.add(asdf);
      InnerClass jkl = asdf;
      z.add(jkl);
   }
}