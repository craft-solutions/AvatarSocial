/**
 * This file was generated by Craft Solutions team, and the code
 * bellow should not be copied, transfered, or tamper with in part
 * or in total without the express authorization of the directing
 * parties of Craft or the authoring clients defined by Craft.
 *
 * Fail to complain to these requirements make the party subject
 * for legal actions and prosecution. For more details contact
 * Craft Solutions at contact@craft-solutions.com.
 */
package com.craft.anje.avatarsocial;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.Serializable;

/**
 * <p> Wraps up a video file information. </p>
 *
 * Created on 20/11/2014
 * @version CRAFT-PBCA-1.0
 * @author <a href="mailto:joao.rios@craft-solutions.com">Joao Gonzalez</a>
 */
public class VideoPartWrapper implements Serializable {
	private static final long serialVersionUID = 1182890269212720020L;
	
	/**
	 * <p> Wraps up a video data into an OOP approach. </p>
	 * @param b	The file bytes
	 * @param index	The file index to be used
	 */
	public VideoPartWrapper(byte[] b, int index) {
		setData(b);
		setFileName(index+".part");
		setContentType("");
	}
	public VideoPartWrapper(int index) {
		this(null, index);
	}
	
	/**
	 * <p> Reads the file from the directory. </p>
	 * @throws IOException
	 */
	public boolean read (BaseServlet servlet) throws IOException {
		File file = new File (servlet.getFileBatchDirectory(), getFileName());
		
		if (file.exists() && file.isFile()) {
			ByteArrayOutputStream bout = new ByteArrayOutputStream((int) file.length());
			BufferedInputStream bin = new BufferedInputStream(new FileInputStream(file));
			
			setFile(file);
			try {
				int BUF = 4096, read;
				byte []b = new byte[BUF];
				// Reads the bytes
				while ( (read=bin.read(b, 0, BUF)) != -1 ) {
					bout.write(b, 0, read);
				}
				
				// After reading the bytes saves in the byte container
				setData(bout.toByteArray());
			}
			finally {
				bin.close();
			}
			return true;
		}
		else return false;
	}

	/**
	 * @return the fileName
	 */
	public String getFileName() {
		return fileName;
	}
	/**
	 * @param fileName the fileName to set
	 */
	public void setFileName(String fileName) {
		this.fileName = fileName;
	}
	/**
	 * @return the data
	 */
	public byte[] getData() {
		return data;
	}
	/**
	 * @param data the data to set
	 */
	public void setData(byte[] data) {
		this.data = data;
	}
	/**
	 * @return the contentType
	 */
	public String getContentType() {
		return contentType;
	}
	/**
	 * @param contentType the contentType to set
	 */
	public void setContentType(String contentType) {
		this.contentType = contentType;
	}

	/**
	 * @return the file
	 */
	public File getFile() {
		return file;
	}
	/**
	 * @param file the file to set
	 */
	public void setFile(File file) {
		this.file = file;
	}

	// class properties
	private String fileName;
	private byte []data;
	private String contentType;
	private File file;
}
