Hey Rashmi,

I have made some changes in the code. Please look through it. For your reference I have marked the changes in the functions:

	package Components;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import javax.tools.JavaCompiler.CompilationTask;

import org.apache.commons.collections4.CollectionUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffEntry.ChangeType;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.errors.CorruptObjectException;
import org.eclipse.jgit.errors.IncorrectObjectTypeException;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseException;
import com.sun.source.tree.CompilationUnitTree;
import com.sun.source.tree.LineMap;
import com.sun.source.tree.MethodTree;
import com.sun.source.util.JavacTask;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreeScanner;
import com.sun.source.util.Trees;

import javaslang.collection.Array;
import Components.ChangesPerFile;
import japa.parser.ast.CompilationUnit;

public class MethodFinder {
	private static Git git;
	private static Repository repository;
	private static FileOutputStream fop = null;
	private static FileInputStream fin=null;
	private static byte[] contentInBytes;
	private static File file;
	private static File gitWorkDir = new File("C:/Git/Rashmi_Devanshi");
	private static HashSet<MethodNamesLines> funcDetails;
	public static void readOutput(Process proc) throws IOException, ParseException {
		file = new File("C:\\Users\\I339240\\Documents\\Difference.txt");
		fop = new FileOutputStream(file);
		if (!file.exists()) {
			file.createNewFile();
		}
		
		abc;
		InputStream is = (InputStream) proc.getInputStream();
		InputStreamReader isr = new InputStreamReader(is);
		BufferedReader br = new BufferedReader(isr);
		String line;
		while ((line = br.readLine()) != null) {
			contentInBytes=String.format("%s"+"\n", line).getBytes();
			fop.write(contentInBytes);    
		}
		fop.close();
	}
	private static String[] FindGitCommitFiles( String commitHash ) throws IOException {           //------This function needs to be changed completely

		Collection<String> pathnames = new ArrayList<>();
		Collection<String> pathnames1 = new ArrayList<>();
		Collection<String> pathnames2 = new ArrayList<>();
		String line;
		Process p1=Runtime.getRuntime().exec("git ls-tree -r "+commitHash+" --name-only", null, gitWorkDir);
		InputStream is = (InputStream) p1.getInputStream();
		InputStreamReader isr = new InputStreamReader(is);
		BufferedReader br = new BufferedReader(isr);

		while ((line = br.readLine()) != null) {
			pathnames1.add(line);
		}
		RevWalk revWalk = new RevWalk(repository);
		ObjectId treeId = ObjectId.fromString(commitHash);
		RevCommit commit = revWalk.parseCommit(treeId);
		RevCommit[] Parents = commit.getParents();
		for(RevCommit parent:Parents) {
			RevCommit ParentCommit = revWalk.parseCommit(parent.getId());
			String parentname = ParentCommit.getId().toString();
			String[] parentObjectDetailsSplit = parentname.split("\\s+");
			String Parentcommit = parentObjectDetailsSplit[1];
			Process p2=Runtime.getRuntime().exec("git ls-tree -r "+Parentcommit+" --name-only", null, gitWorkDir);
			InputStream is2 = (InputStream) p2.getInputStream();
			InputStreamReader isr2 = new InputStreamReader(is2);
			BufferedReader br2 = new BufferedReader(isr2);

			while ((line = br2.readLine()) != null) {
				pathnames2.add(line);
			}

		}
		Iterable<String> paths = CollectionUtils.union(pathnames1, pathnames2);
		return ( String[] )((Collection<String>) paths).toArray( new String[ pathnames.size() ] );
	}
	public static void createFile(ObjectId tree, String filename, String filechanged) throws MissingObjectException, IncorrectObjectTypeException, CorruptObjectException, IOException {

		File file = new File(filename);
		TreeWalk treeWalk = new TreeWalk(repository);
		treeWalk.addTree(tree);
		treeWalk.setRecursive(true);
		treeWalk.setFilter(PathFilter.create(filechanged));
		if (!treeWalk.next()) 
		{
			//System.out.println("Nothing found!");
			return;
		}
		ObjectId objectId = treeWalk.getObjectId(0);
		ObjectLoader loader = repository.open(objectId);

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		loader.copyTo(out);

		if (!file.exists()) {
			file.createNewFile();
		}
		fop = new FileOutputStream(file);
		contentInBytes = out.toString().getBytes();
		fop.write(contentInBytes);
	}
	public static HashSet<ChangesPerFile> DifferenceFile() throws IOException{               //--To increase the efficiency I have introduced continue statements                                      
		HashSet<ChangesPerFile> dif=new HashSet<ChangesPerFile>();
		HashSet<ChangesPerFile> tempinitial = new HashSet<ChangesPerFile>();
		HashSet<ChangesPerFile> tempnew = new HashSet<ChangesPerFile>();
		ChangesPerFile c;
		Pattern pattFileName=Pattern.compile("[A-Za-z]+(.java)");
		Pattern pattinitial=Pattern.compile("(\\*\\*\\*) [0-9,]+");
		Pattern pattnew=Pattern.compile("(\\-\\-\\-) [0-9,]+");
		Pattern pattnum=Pattern.compile("-?\\d+");
		Pattern pattadd=Pattern.compile("^\\+\\s");
		Pattern pattsub=Pattern.compile("^\\-\\s");
		Pattern pattmod=Pattern.compile("^!\\s");
		BufferedReader r = new BufferedReader(new FileReader("C:\\Users\\I339240\\Documents\\Difference.txt"));
		String line,Filename="",type;
		int x,PStartingpoint=0,PEndingPoint=0,NStartingpoint=0,NEndingPoint=0,linenum=0,NoInitial=0,NoNew=0,start,end;
		Matcher mnum,m,minitial,mnew,madd,msub,mmod;
		while ((line = r.readLine()) != null) {
			m = pattFileName.matcher(line);
			minitial = pattinitial.matcher(line);
			mnew = pattnew.matcher(line);
			madd = pattadd.matcher(line);
			msub = pattsub.matcher(line);
			mmod = pattmod.matcher(line);
			if (m.find()) {
				if (tempnew.isEmpty()==true&&tempinitial.isEmpty()==false) {
					dif.addAll(tempinitial);
				}
				else if (tempnew.isEmpty()==false){
					dif.addAll(tempnew);
				}
				start = m.start(0);
				end = m.end(0);
				Filename=line.substring(start, end);
				continue;
			}
			if (minitial.find()) {

				NoNew=0;
				tempinitial=new HashSet<ChangesPerFile>();
				start = minitial.start(0);
				end = minitial.end(0);
				String Previousline=line.substring(start, end);

				mnum=pattnum.matcher(Previousline);
				x=1;
				while (mnum.find()) {
					if(x==1) {
						PStartingpoint=Integer.parseInt(mnum.group());
					}
					if(x==2) {
						PEndingPoint=Integer.parseInt(mnum.group());
					}
					x++;
				}
				if(x==2) {
					NoInitial=0;
					linenum++; 
					continue;
				}

				linenum=PStartingpoint-1;
				NoInitial=PEndingPoint-PStartingpoint;
				linenum++; 
				continue;
			}
			if (mnew.find()) {
				tempnew=new HashSet<ChangesPerFile>();
				start = mnew.start(0);
				end = mnew.end(0);
				String New=line.substring(start, end);

				mnum=pattnum.matcher(New);
				x=1;
				while (mnum.find()) {
					if(x==1) {
						NStartingpoint=Integer.parseInt(mnum.group());
					}
					if(x==2) {
						NEndingPoint=Integer.parseInt(mnum.group());
					}
					x++;
				}
				linenum=NStartingpoint-1;
				NoNew=NEndingPoint-NStartingpoint;
				linenum++; 
				continue;
			}
			if (madd.find()) {
				type="+";
				c=new ChangesPerFile(Filename,linenum,type); 
				dif.add(c);
				linenum++; 
				continue;
			}
			if (msub.find()) {
				type="-";
				c=new ChangesPerFile(Filename,linenum,type); 
				dif.add(c);
				linenum++; 
				continue;
			}
			if (mmod.find()) {

				if(NoNew>=NoInitial) {
					type="+";
					c=new ChangesPerFile(Filename,linenum,type); 
					tempnew.add(c);
				}
				else if(NoNew==0)
				{
					type="-";
					c=new ChangesPerFile(Filename,linenum,type); 
					tempinitial.add(c);
				}
			}
			linenum++; 
		}
		if (tempnew.isEmpty()==true&&tempinitial.isEmpty()==false) {
			dif.addAll(tempinitial);
		}
		else if (tempnew.isEmpty()==false){
			dif.addAll(tempnew);
		}
		return dif;       
	}
	public static HashSet<MethodNames> Comparison(HashSet<ChangesPerFile> dif,HashSet<MethodNamesLines> PrevFuncDetails,HashSet<MethodNamesLines> NewFuncDetails,String Filename) {
		HashSet<MethodNames> MethodList=new HashSet<MethodNames>();
		MethodNames mn;
		for(ChangesPerFile ch:dif) {
			if(ch.getFilename().equals(Filename)) {
				if(ch.gettype()=="+") {
					for(MethodNamesLines m:NewFuncDetails) {
						if(ch.getLineNum()>=(int)m.getStart()&&ch.getLineNum()<=(int)m.getEnd()) {
							mn=new MethodNames(ch.getFilename(),m.getMethodName());
							MethodList.add(mn);
							break;
						}

					}
				}else if(ch.gettype()=="-") {
					for(MethodNamesLines m:PrevFuncDetails) {
						if(ch.getLineNum()>=(int)m.getStart()&&ch.getLineNum()<=(int)m.getEnd()) {
							mn=new MethodNames(ch.getFilename(),m.getMethodName());
							MethodList.add(mn);
							break;
						}
					}
				}
			}
		}
		return MethodList;
	}
	public static HashSet<ChangesPerFile> MethodofEachFile(String commitHash) throws MissingObjectException, IncorrectObjectTypeException, IOException, GitAPIException, ParseException {

		HashSet<ChangesPerFile> change=new HashSet<ChangesPerFile>();
		HashSet<ChangesPerFile> changesub=new HashSet<ChangesPerFile>();
		RevWalk revWalk = new RevWalk(repository);
		ObjectId treeId = ObjectId.fromString(commitHash);
		RevCommit commit = revWalk.parseCommit(treeId);
		RevTree tree = commit.getTree();
		RevCommit[] Parents = commit.getParents();
		for(RevCommit parent:Parents) {
			RevCommit ParentCommit = revWalk.parseCommit(parent.getId());
			String parentname = ParentCommit.getId().toString();
			String[] parentObjectDetailsSplit = parentname.split("\\s+");
			String Parentcommit = parentObjectDetailsSplit[1];
			Process p1=Runtime.getRuntime().exec("git difftool -y -x \"diff -c\" "+Parentcommit+" "+commitHash, null, gitWorkDir);
			readOutput(p1);
			changesub=DifferenceFile();
			change.addAll(changesub);              
		}
		return change;   
	}
	public static HashSet<MethodNames> MethodFind(String commitHash) throws MissingObjectException, IncorrectObjectTypeException, IOException, GitAPIException, ParseException {

		git = Git.open(gitWorkDir);
		repository = git.getRepository();
		HashSet<MethodNames> changedMethods = new HashSet<MethodNames>();
		HashSet<MethodNames> changedMethodsub = new HashSet<MethodNames>();
		HashSet<ChangesPerFile> ChangesEachMethodsub = new HashSet<ChangesPerFile>();
		HashSet<ChangesPerFile> ChangesEachMethod = new HashSet<ChangesPerFile>();
		HashSet<MethodNamesLines> PrevFuncDetails;
		HashSet<MethodNamesLines> NewFuncDetails;
		ObjectId treeId = ObjectId.fromString(commitHash);
		RevWalk revWalk = new RevWalk(repository);
		RevCommit commit = revWalk.parseCommit(treeId);
		RevTree tree = commit.getTree();

		String file1 = "C:\\Users\\I339240\\Documents\\CurrentFile.java";
		String file2 = "C:\\Users\\I339240\\Documents\\ParentFile.java";

		String[] Pathnames=FindGitCommitFiles(commitHash);
		ChangesEachMethod=MethodofEachFile(commitHash);

		for(String path:Pathnames) {
			createFile(tree,file1,path);
			NewFuncDetails=MethodLines(file1);
			RevCommit[] Parents = commit.getParents();
			for(RevCommit parent:Parents) {
				RevCommit ParentCommit = revWalk.parseCommit(parent.getId());
				RevTree ParentTree = ParentCommit.getTree();
				createFile(ParentTree,file2,path);
				PrevFuncDetails=MethodLines(file2);
				changedMethodsub=Comparison(ChangesEachMethod,PrevFuncDetails,NewFuncDetails,path);
				changedMethods.addAll(changedMethodsub);
			}
		}
		return changedMethods;
	}
	public static HashSet<MethodNamesLines> MethodLines(String Filename) {

		HashSet<MethodNamesLines> MethodDetails=new HashSet<MethodNamesLines>(); 
		JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
		DiagnosticCollector<JavaFileObject> diagnosticsCollector = new DiagnosticCollector<JavaFileObject>();
		StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnosticsCollector, null, null);
		Iterable<? extends JavaFileObject> fileObjects = fileManager.getJavaFileObjects(Filename);
		CompilationTask task = compiler.getTask(null, fileManager, diagnosticsCollector, null, null, fileObjects);

		JavacTask javacTask = (JavacTask) task;
		SourcePositions sourcePositions = Trees.instance(javacTask).getSourcePositions();
		Iterable<? extends CompilationUnitTree> parseResult = null;
		try {
			parseResult = javacTask.parse();
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(0);
		}
		for (CompilationUnitTree compilationUnitTree : parseResult) {
			funcDetails=new HashSet<MethodNamesLines>();
			compilationUnitTree.accept(new MethodLineLogger(compilationUnitTree, sourcePositions), null);
			MethodDetails.addAll(funcDetails);

		}
		return MethodDetails;
	}

	private static class MethodLineLogger extends TreeScanner<Void, Void> {
		private final CompilationUnitTree compilationUnitTree;
		private final SourcePositions sourcePositions;
		private final LineMap lineMap;

		private MethodLineLogger(CompilationUnitTree compilationUnitTree, SourcePositions sourcePositions) {
			this.compilationUnitTree = compilationUnitTree;
			this.sourcePositions = sourcePositions;
			this.lineMap = compilationUnitTree.getLineMap();
		}

		public Void visitMethod(MethodTree arg0, Void arg1) {

			long startPosition = sourcePositions.getStartPosition(compilationUnitTree, arg0);
			long startLine = lineMap.getLineNumber(startPosition);
			long endPosition = sourcePositions.getEndPosition(compilationUnitTree, arg0);
			long endLine = lineMap.getLineNumber(endPosition);
			MethodNamesLines m=new MethodNamesLines(arg0.getName().toString(),startLine,endLine);
			funcDetails.add(m);

			return super.visitMethod(arg0, arg1);
		}
	}

}

Thanks and Regards,
Devanshi Pandey.
